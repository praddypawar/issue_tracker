import strawberry
from strawberry.fastapi import GraphQLRouter
from strawberry.types import Info
from typing import List, Optional
from app.graphql.types import IssueType, IssueStatus, IssuePriority
from datetime import datetime
from app.database import get_db
from app.models.issue import Issue as IssueModel
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, Request, WebSocket
from app.models.user import User as UserModel
from app.models.tag import Tag as TagModel
from app.graphql.types import UserType, TagType, IssueCreateInput, IssueUpdateInput
from sqlalchemy import update, delete
from app.services.auth import decode_access_token, verify_password, create_access_token
from fastapi import HTTPException
from app.graphql.types import (
    InviteTeamMemberInput,
    EnhancedDescriptionResult,
    UserCreateInput,
    UserUpdateInput,
)
from app.models.team_member import TeamMember as TeamMemberModel
from sqlalchemy import insert
from app.services.ai import AIDescriptionEnhancer
from strawberry.subscriptions import GRAPHQL_TRANSPORT_WS_PROTOCOL, GRAPHQL_WS_PROTOCOL
import asyncio
from sqlalchemy.future import select
from app.schemas.user import UserRead
from app.database import AsyncSessionLocal
from sqlalchemy import func
from app.graphql.types import IssueUpdateResponse
from app.services.auth import hash_password
from app.services.websocket import websocket_manager, EventType
from app.services.user_activity import UserActivityService
from app.services.permissions import PermissionService
from app.models.user_activity import ActivityType
from app.models.user import UserRole, UserStatus
from app.models.permission import PermissionType
from app.models.user_activity import UserActivity
from app.models.permission import Permission
from app.graphql.types import UserActivityType, UserStatsType
from app.graphql.types import IssueStatsType
from app.models.comment import Comment as CommentModel
from app.graphql.types import CommentType, CommentCreateInput
from app.graphql.types import TagCreateInput, TagUpdateInput
from sqlalchemy.orm import selectinload


class SimplePubSub:
    def __init__(self):
        self.queues = {}

    def get_queue(self, topic):
        if topic not in self.queues:
            self.queues[topic] = []
        return self.queues[topic]

    async def publish(self, topic, message):
        queues = self.get_queue(topic)
        for queue in queues:
            await queue.put(message)

    async def subscribe(self, topic):
        queue = asyncio.Queue()
        self.get_queue(topic).append(queue)
        try:
            while True:
                message = await queue.get()
                yield message
        finally:
            self.get_queue(topic).remove(queue)


pubsub = SimplePubSub()

ai_enhancer = AIDescriptionEnhancer()


async def get_context_dependency(
    request: Request = None, ws: WebSocket = None, db: AsyncSession = Depends(get_db)
):
    user = None
    if request:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            payload = decode_access_token(token)
            user_id = payload.get("sub") if payload else None
            if user_id:
                result = await db.execute(
                    select(UserModel).where(UserModel.id == int(user_id))
                )
                user = result.scalar_one_or_none()
    return {"request": request, "db": db, "user": user}


def get_current_user(info):
    user = info.context.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "ok"

    @strawberry.field
    async def issues(self, info) -> List[IssueType]:
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(IssueModel).options(selectinload(IssueModel.tags))
        )
        issues = result.unique().scalars().all()
        return [
            IssueType(
                id=issue.id,
                title=issue.title,
                description=issue.description,
                enhanced_description=getattr(issue, "enhanced_description", None),
                status=issue.status,
                priority=issue.priority,
                assignee_id=issue.assignee_id,
                reporter_id=issue.reporter_id,
                created_at=issue.created_at,
                updated_at=issue.updated_at,
                tags=(
                    [
                        TagType(id=tag.id, name=tag.name, color=tag.color)
                        for tag in issue.tags
                    ]
                    if issue.tags
                    else []
                ),
            )
            for issue in issues
        ]

    @strawberry.field
    async def issue(self, info, id: int) -> IssueType | None:
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            IssueModel.__table__.select().where(IssueModel.id == id)
        )
        row = result.first()
        if not row:
            return None
        row = row[0] if isinstance(row, tuple) else row
        return IssueType(
            id=row.id,
            title=row.title,
            description=row.description,
            enhanced_description=row.enhanced_description,
            status=row.status,
            priority=row.priority,
            assignee_id=row.assignee_id,
            reporter_id=row.reporter_id,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @strawberry.field
    async def users(self, info) -> List[UserType]:
        db: AsyncSession = info.context["db"]
        result = await db.execute(UserModel.__table__.select())
        users = result.fetchall()

        user_types = []
        for row in users:
            # Get user stats
            user_stats = await UserActivityService.get_user_stats(db, row.id)

            user_types.append(
                UserType(
                    id=row.id,
                    email=row.email,
                    username=row.username,
                    first_name=row.first_name,
                    last_name=row.last_name,
                    role=row.role,
                    status=row.status,
                    last_login=row.last_login,
                    created_at=row.created_at,
                    updated_at=row.updated_at,
                    assigned_issues_count=user_stats["assigned_issues_count"],
                    reported_issues_count=user_stats["reported_issues_count"],
                    recent_activity=None,  # Will be populated separately if needed
                )
            )

        return user_types

    @strawberry.field
    async def user_activities(
        self, info, user_id: Optional[int] = None, limit: int = 20
    ) -> List[UserActivityType]:
        db: AsyncSession = info.context["db"]
        activities = await UserActivityService.get_user_activities(
            db, user_id, limit=limit
        )

        return [
            UserActivityType(
                id=activity.id,
                activity_type=activity.activity_type,
                description=activity.description,
                details=activity.details,
                ip_address=activity.ip_address,
                user_agent=activity.user_agent,
                created_at=activity.created_at,
            )
            for activity in activities
        ]

    @strawberry.field
    async def user_stats(self, info) -> UserStatsType:
        db: AsyncSession = info.context["db"]
        stats = await UserActivityService.get_team_activity_summary(db)

        return UserStatsType(
            total_users=stats["total_users"],
            active_users=stats["active_users"],
            new_users_this_month=stats["new_users_this_month"],
            users_by_role=stats["users_by_role"],
            recent_activity=[
                UserActivityType(
                    id=activity.id,
                    activity_type=activity.activity_type,
                    description=activity.description,
                    details=activity.details,
                    ip_address=activity.ip_address,
                    user_agent=activity.user_agent,
                    created_at=activity.created_at,
                )
                for activity in stats["recent_activities"]
            ],
        )

    @strawberry.field
    async def tags(self, info) -> List[TagType]:
        db: AsyncSession = info.context["db"]
        result = await db.execute(TagModel.__table__.select())
        tags = result.fetchall()
        return [
            TagType(
                id=row.id,
                name=row.name,
                color=row.color,
            )
            for row in tags
        ]

    @strawberry.field
    async def permissions(
        self, info, role: Optional[str] = None
    ) -> List[PermissionType]:
        db: AsyncSession = info.context["db"]

        if role:
            query = select(Permission).where(Permission.role == role)
        else:
            query = select(Permission)

        result = await db.execute(query)
        permissions = result.scalars().all()

        return [
            PermissionType(
                id=perm.id,
                user_id=perm.user_id,
                permission_type=perm.permission_type.value,
                granted=perm.granted,
                created_at=perm.created_at,
            )
            for perm in permissions
        ]

    @strawberry.field
    async def issue_stats(self, info) -> IssueStatsType:
        db: AsyncSession = info.context["db"]
        result = await db.execute(IssueModel.__table__.select())
        issues = result.fetchall()
        total_issues = len(issues)
        open_issues = len([i for i in issues if i.status == "OPEN"])
        in_progress_issues = len([i for i in issues if i.status == "IN_PROGRESS"])
        closed_issues = len([i for i in issues if i.status == "CLOSED"])
        my_assigned_issues = 0  # Quick fix: no per-user stats
        return IssueStatsType(
            total_issues=total_issues,
            open_issues=open_issues,
            in_progress_issues=in_progress_issues,
            closed_issues=closed_issues,
            my_assigned_issues=my_assigned_issues,
            recent_activity=[],
        )

    @strawberry.field
    async def me(self, info) -> Optional[UserType]:
        db: AsyncSession = info.context["db"]
        request = info.context.get("request")
        token = None
        if request and "authorization" in request.headers:
            auth_header = request.headers["authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ", 1)[1]
        if not token:
            return None
        from app.services.auth import decode_access_token

        payload = decode_access_token(token)
        user_id = payload.get("sub") if payload else None
        if not user_id:
            return None
        result = await db.execute(select(UserModel).where(UserModel.id == int(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            return None
        user_stats = await UserActivityService.get_user_stats(db, user.id)
        return UserType(
            id=user.id,
            email=user.email,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            status=user.status,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
            assigned_issues_count=user_stats["assigned_issues_count"],
            reported_issues_count=user_stats["reported_issues_count"],
            recent_activity=None,
        )

    @strawberry.field
    async def comments(self, info, issue_id: int) -> List[CommentType]:
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            CommentModel.__table__.select()
            .where(CommentModel.issue_id == issue_id)
            .order_by(CommentModel.created_at.asc())
        )
        rows = result.fetchall()
        return [
            CommentType(
                id=row.id,
                issueId=row.issue_id,
                userId=row.user_id,
                content=row.content,
                createdAt=row.created_at,
            )
            for row in rows
        ]


@strawberry.type
class Subscription:
    @strawberry.subscription
    async def issue_created(self, info) -> IssueType:
        async for issue in pubsub.subscribe("issue_created"):
            yield issue

    @strawberry.subscription
    async def issue_updated(self, info) -> IssueType:
        async for issue in pubsub.subscribe("issue_updated"):
            yield issue

    @strawberry.subscription
    async def issue_status_changed(self, info, issue_id: int) -> IssueType:
        async for issue in pubsub.subscribe(f"issue_status_changed_{issue_id}"):
            yield issue


@strawberry.type
class LoginResult:
    access_token: str


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_tag(self, info, input: TagCreateInput) -> TagType:
        db: AsyncSession = info.context["db"]
        tag = TagModel(name=input.name, color=input.color)
        db.add(tag)
        await db.commit()
        await db.refresh(tag)
        return TagType(id=tag.id, name=tag.name, color=tag.color)

    @strawberry.mutation
    async def update_tag(self, info, input: TagUpdateInput) -> TagType:
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            TagModel.__table__.select().where(TagModel.id == input.id)
        )
        tag = result.first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        tag = tag[0] if isinstance(tag, tuple) else tag
        if input.name is not None:
            tag.name = input.name
        if input.color is not None:
            tag.color = input.color
        db.add(tag)
        await db.commit()
        await db.refresh(tag)
        return TagType(id=tag.id, name=tag.name, color=tag.color)

    @strawberry.mutation
    async def delete_tag(self, info, id: int) -> bool:
        db: AsyncSession = info.context["db"]
        result = await db.execute(TagModel.__table__.select().where(TagModel.id == id))
        tag = result.first()
        if not tag:
            return False
        tag = tag[0] if isinstance(tag, tuple) else tag
        await db.delete(tag)
        await db.commit()
        return True

    @strawberry.mutation
    async def create_issue(self, info, input: IssueCreateInput) -> IssueType:
        user = get_current_user(info)
        db: AsyncSession = info.context["db"]
        # AI enhancement
        ai_result = await ai_enhancer.enhance_description(input.description)
        enhanced_description = ai_result["enhanced_text"]
        new_issue = IssueModel(
            title=input.title,
            description=input.description,
            enhanced_description=enhanced_description,
            status=(
                input.status.value if hasattr(input.status, "value") else input.status
            ),
            priority=(
                input.priority.value
                if hasattr(input.priority, "value")
                else input.priority
            ),
            assignee_id=input.assignee_id,
            reporter_id=user.id,  # Always use current user as reporter
        )
        if input.tag_ids:
            tags_result = await db.execute(
                select(TagModel).where(TagModel.id.in_(input.tag_ids))
            )
            tag_objs = tags_result.scalars().all()
            new_issue.tags = tag_objs
        db.add(new_issue)
        await db.commit()
        await db.refresh(new_issue)
        issue_obj = IssueType(
            id=new_issue.id,
            title=new_issue.title,
            description=new_issue.description,
            enhanced_description=new_issue.enhanced_description,
            status=new_issue.status,
            priority=new_issue.priority,
            assignee_id=new_issue.assignee_id,
            reporter_id=new_issue.reporter_id,
            created_at=new_issue.created_at,
            updated_at=new_issue.updated_at,
        )
        await pubsub.publish("issue_created", issue_obj)
        await websocket_manager.broadcast_to_all(
            EventType.ISSUE_CREATED,
            {
                "id": issue_obj.id,
                "title": issue_obj.title,
                "description": issue_obj.description,
                "status": issue_obj.status,
                "priority": issue_obj.priority,
                "assignee_id": issue_obj.assignee_id,
                "reporter_id": issue_obj.reporter_id,
                "created_at": issue_obj.created_at.isoformat(),
                "updated_at": issue_obj.updated_at.isoformat(),
            },
        )
        return issue_obj

    @strawberry.mutation
    async def update_issue(
        self, input: IssueUpdateInput, info: Info
    ) -> IssueUpdateResponse:
        db = info.context["db"]
        # Permission check: only reporter can edit
        result = await db.execute(
            select(IssueModel)
            .options(selectinload(IssueModel.tags))
            .where(IssueModel.id == input.id)
        )
        issue = result.unique().scalar_one_or_none()
        if not issue:
            return IssueUpdateResponse(
                success=False, message="Issue not found", issue=None
            )
        user = get_current_user(info)
        if issue.reporter_id != user.id:
            raise HTTPException(
                status_code=403, detail="Not allowed to edit this issue"
            )
        try:
            update_data = {}
            if input.title is not None:
                update_data["title"] = input.title
            if input.description is not None:
                update_data["description"] = input.description
                # AI enhancement on update
                ai_result = await ai_enhancer.enhance_description(input.description)
                update_data["enhanced_description"] = ai_result["enhanced_text"]
            if input.status is not None:
                update_data["status"] = input.status.value
            if input.priority is not None:
                update_data["priority"] = input.priority.value
            if input.assignee_id is not None:
                update_data["assignee_id"] = input.assignee_id
            update_data["updated_at"] = func.now()
            await db.execute(
                update(IssueModel)
                .where(IssueModel.id == input.id)
                .values(**update_data)
            )
            # Fetch the updated issue with tags using selectinload
            result = await db.execute(
                select(IssueModel)
                .options(selectinload(IssueModel.tags))
                .where(IssueModel.id == input.id)
            )
            updated_issue = result.unique().scalars().one_or_none()
            if not updated_issue:
                return IssueUpdateResponse(
                    success=False, message="Issue not found", issue=None
                )
            # Update tags if provided
            if input.tag_ids is not None:
                tags_result = await db.execute(
                    select(TagModel).where(TagModel.id.in_(input.tag_ids))
                )
                tag_objs = tags_result.scalars().all()
                updated_issue.tags = tag_objs
                db.add(updated_issue)
            await db.commit()
            issue_obj = IssueType(
                id=updated_issue.id,
                title=updated_issue.title,
                description=updated_issue.description,
                enhanced_description=updated_issue.enhanced_description,
                status=updated_issue.status,
                priority=updated_issue.priority,
                assignee_id=updated_issue.assignee_id,
                reporter_id=updated_issue.reporter_id,
                created_at=updated_issue.created_at,
                updated_at=updated_issue.updated_at,
                tags=(
                    [
                        TagType(id=tag.id, name=tag.name, color=tag.color)
                        for tag in updated_issue.tags
                    ]
                    if updated_issue.tags
                    else []
                ),
            )
            # Publish to pubsub for GraphQL subscriptions
            await pubsub.publish("issue_updated", issue_obj)
            await websocket_manager.broadcast_to_all(
                EventType.ISSUE_UPDATED,
                {
                    "id": issue_obj.id,
                    "title": issue_obj.title,
                    "description": issue_obj.description,
                    "status": issue_obj.status,
                    "priority": issue_obj.priority,
                    "assignee_id": issue_obj.assignee_id,
                    "reporter_id": issue_obj.reporter_id,
                    "created_at": issue_obj.created_at.isoformat(),
                    "updated_at": issue_obj.updated_at.isoformat(),
                },
            )
            return IssueUpdateResponse(
                success=True, message="Issue updated successfully", issue=issue_obj
            )
        except Exception as e:
            await db.rollback()
            return IssueUpdateResponse(
                success=False, message=f"Error updating issue: {str(e)}", issue=None
            )

    @strawberry.mutation
    async def delete_issue(self, info, id: int) -> IssueType | None:
        user = get_current_user(info)
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            IssueModel.__table__.select().where(IssueModel.id == id)
        )
        row = result.first()
        if not row:
            return None
        row = row[0] if isinstance(row, tuple) else row
        if row.reporter_id != user.id:
            raise HTTPException(
                status_code=403, detail="Not allowed to delete this issue"
            )
        # Build IssueType before deleting
        tags = getattr(row, "tags", [])
        tag_objs = (
            [TagType(id=tag.id, name=tag.name, color=tag.color) for tag in tags]
            if tags
            else []
        )
        deleted_issue = IssueType(
            id=row.id,
            title=row.title,
            description=row.description,
            enhanced_description=getattr(row, "enhanced_description", None),
            status=row.status,
            priority=row.priority,
            assignee_id=row.assignee_id,
            reporter_id=row.reporter_id,
            created_at=row.created_at,
            updated_at=row.updated_at,
            tags=tag_objs,
        )
        await db.execute(delete(IssueModel).where(IssueModel.id == id))
        await db.commit()
        # Broadcast real-time update
        await websocket_manager.broadcast_to_all(
            EventType.ISSUE_DELETED,
            {
                "id": id,
                "deleted_by": user.id,
                "timestamp": datetime.now().isoformat(),
            },
        )
        return deleted_issue

    @strawberry.mutation
    async def invite_team_member(self, info, input: InviteTeamMemberInput) -> bool:
        user = get_current_user(info)
        db: AsyncSession = info.context["db"]
        # Check if user exists
        result = await db.execute(
            UserModel.__table__.select().where(UserModel.email == input.email)
        )
        invited = result.first()
        if not invited:
            # In a real app, send invite email here
            return False
        invited = invited[0] if isinstance(invited, tuple) else invited
        # Add to team_members if not already
        exists = await db.execute(
            TeamMemberModel.__table__.select().where(
                TeamMemberModel.user_id == invited.id
            )
        )
        if exists.first():
            return True
        db.add(TeamMemberModel(user_id=invited.id, invited_by=user.id, role=input.role))
        await db.commit()
        return True

    @strawberry.mutation
    async def enhance_description(
        self, info, description: str
    ) -> EnhancedDescriptionResult:
        result = await ai_enhancer.enhance_description(description)
        return EnhancedDescriptionResult(
            enhanced_text=result["enhanced_text"],
            markdown_html=result["markdown_html"],
            original=result["original"],
        )

    @strawberry.mutation
    async def login(self, info, email: str, password: str) -> LoginResult | None:
        db = info.context["db"]
        result = await db.execute(select(UserModel).where(UserModel.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            return None

        # Update last_login
        from datetime import datetime

        user.last_login = datetime.utcnow()
        await db.commit()

        token = create_access_token({"sub": str(user.id)})
        return LoginResult(access_token=token)

    @strawberry.mutation
    async def create_user(self, info, input: UserCreateInput) -> UserType:
        db: AsyncSession = info.context["db"]

        # Check if user already exists
        result = await db.execute(
            UserModel.__table__.select().where(UserModel.email == input.email)
        )
        if result.first():
            raise HTTPException(
                status_code=400, detail="User with this email already exists"
            )

        new_user = UserModel(
            email=input.email,
            username=input.username,
            first_name=input.first_name,
            last_name=input.last_name,
            password_hash=hash_password(input.password),
            role=input.role,
            status=input.status,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # Log the activity
        await UserActivityService.log_activity(
            db=db,
            user_id=new_user.id,
            activity_type=ActivityType.CREATE_USER,
            description=f"User {new_user.email} was created",
            details={"email": new_user.email, "role": new_user.role.value},
        )

        return UserType(
            id=new_user.id,
            email=new_user.email,
            username=new_user.username,
            first_name=new_user.first_name,
            last_name=new_user.last_name,
            role=new_user.role,
            status=new_user.status,
            last_login=new_user.last_login,
            created_at=new_user.created_at,
            updated_at=new_user.updated_at,
            assigned_issues_count=0,
            reported_issues_count=0,
            recent_activity=None,
        )

    @strawberry.mutation
    async def update_user(self, info, input: UserUpdateInput) -> UserType:
        db: AsyncSession = info.context["db"]

        # Check if user exists
        result = await db.execute(
            UserModel.__table__.select().where(UserModel.id == input.id)
        )
        user = result.first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user = user[0] if isinstance(user, tuple) else user

        # Check if email is being changed and if it's already taken
        if input.email and input.email != user.email:
            email_check = await db.execute(
                UserModel.__table__.select().where(UserModel.email == input.email)
            )
            if email_check.first():
                raise HTTPException(status_code=400, detail="Email already taken")

        # Check if username is being changed and if it's already taken
        if input.username and input.username != user.username:
            username_check = await db.execute(
                UserModel.__table__.select().where(UserModel.username == input.username)
            )
            if username_check.first():
                raise HTTPException(status_code=400, detail="Username already taken")

        # Track changes for activity logging
        changes = {}
        old_role = user.role
        old_status = user.status

        # Update user fields
        update_data = {}
        if input.email is not None:
            update_data["email"] = input.email
            changes["email"] = {"old": user.email, "new": input.email}
        if input.username is not None:
            update_data["username"] = input.username
            changes["username"] = {"old": user.username, "new": input.username}
        if input.first_name is not None:
            update_data["first_name"] = input.first_name
            changes["first_name"] = {"old": user.first_name, "new": input.first_name}
        if input.last_name is not None:
            update_data["last_name"] = input.last_name
            changes["last_name"] = {"old": user.last_name, "new": input.last_name}
        if input.role is not None:
            update_data["role"] = input.role
            changes["role"] = {"old": old_role.value, "new": input.role.value}
        if input.status is not None:
            update_data["status"] = input.status
            changes["status"] = {"old": old_status.value, "new": input.status.value}

        await db.execute(
            update(UserModel).where(UserModel.id == input.id).values(**update_data)
        )
        await db.commit()

        # Fetch updated user
        result = await db.execute(
            UserModel.__table__.select().where(UserModel.id == input.id)
        )
        updated_user = result.first()
        updated_user = (
            updated_user[0] if isinstance(updated_user, tuple) else updated_user
        )

        # Log the activity
        await UserActivityService.log_activity(
            db=db,
            user_id=updated_user.id,
            activity_type=ActivityType.USER_UPDATED,
            description=f"User {updated_user.email} was updated",
            details={"changes": changes},
        )

        # Get user stats
        user_stats = await UserActivityService.get_user_stats(db, updated_user.id)

        return UserType(
            id=updated_user.id,
            email=updated_user.email,
            username=updated_user.username,
            first_name=updated_user.first_name,
            last_name=updated_user.last_name,
            role=updated_user.role,
            status=updated_user.status,
            last_login=updated_user.last_login,
            created_at=updated_user.created_at,
            updated_at=datetime.now(),
            assigned_issues_count=user_stats["assigned_issues_count"],
            reported_issues_count=user_stats["reported_issues_count"],
            recent_activity=None,
        )

    @strawberry.mutation
    async def update_user_role(self, info, user_id: int, role: UserRole) -> UserType:
        db: AsyncSession = info.context["db"]

        # Check permissions (only admins can change roles)
        current_user = get_current_user(info)
        if not await PermissionService.has_permission(
            db, current_user.id, PermissionType.MANAGE_ROLES
        ):
            raise HTTPException(
                status_code=403, detail="Insufficient permissions to change user roles"
            )

        updated_user = await PermissionService.update_user_role(db, user_id, role)

        # Log the activity
        await UserActivityService.log_activity(
            db=db,
            user_id=current_user.id,
            activity_type=ActivityType.ROLE_CHANGED,
            description=f"User {updated_user.email} role changed to {role.value}",
            details={"user_id": user_id, "new_role": role.value},
        )

        # Get user stats
        user_stats = await UserActivityService.get_user_stats(db, updated_user.id)

        return UserType(
            id=updated_user.id,
            email=updated_user.email,
            username=updated_user.username,
            first_name=updated_user.first_name,
            last_name=updated_user.last_name,
            role=updated_user.role,
            status=updated_user.status,
            last_login=updated_user.last_login,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at,
            assigned_issues_count=user_stats["assigned_issues_count"],
            reported_issues_count=user_stats["reported_issues_count"],
            recent_activity=None,
        )

    @strawberry.mutation
    async def initialize_permissions(self, info) -> bool:
        db: AsyncSession = info.context["db"]
        await PermissionService.initialize_permissions(db)
        return True

    @strawberry.mutation
    async def delete_user(self, info, id: int) -> bool:
        db: AsyncSession = info.context["db"]

        # Check if user exists
        result = await db.execute(
            UserModel.__table__.select().where(UserModel.id == id)
        )
        user = result.first()
        if not user:
            return False
        user = user[0] if isinstance(user, tuple) else user

        # Check if user has any issues assigned or created
        issues_result = await db.execute(
            IssueModel.__table__.select().where(
                (IssueModel.assignee_id == id) | (IssueModel.reporter_id == id)
            )
        )
        if issues_result.first():
            raise HTTPException(
                status_code=400,
                detail="Cannot delete user with assigned or created issues",
            )

        # Delete user
        await db.execute(delete(UserModel).where(UserModel.id == id))
        await db.commit()

        return True

    @strawberry.mutation
    async def add_comment(self, info, input: CommentCreateInput) -> CommentType:
        db: AsyncSession = info.context["db"]
        new_comment = CommentModel(
            issue_id=input.issueId,
            user_id=input.userId,
            content=input.content,
        )
        db.add(new_comment)
        await db.commit()
        await db.refresh(new_comment)
        return CommentType(
            id=new_comment.id,
            issueId=new_comment.issue_id,
            userId=new_comment.user_id,
            content=new_comment.content,
            createdAt=new_comment.created_at,
        )

    @strawberry.mutation
    async def ask_chatbot(self, info, question: str) -> str:
        db: AsyncSession = info.context["db"]
        q = question.lower().strip()
        import re

        print(f"[Chatbot] Received question: {q}")
        # Greetings and small talk
        if any(
            greet in q
            for greet in [
                "hi",
                "hello",
                "hey",
                "greetings",
                "good morning",
                "good afternoon",
                "good evening",
            ]
        ):
            return "Hello! How can I help you with your project issues, tags, or users today?"
        # Fetch project data
        issues_result = await db.execute(select(IssueModel))
        issues = issues_result.unique().scalars().all()
        tags_result = await db.execute(select(TagModel))
        tags = tags_result.scalars().all()
        users_result = await db.execute(select(UserModel))
        users = users_result.scalars().all()
        # Build context
        issues_str = "\n".join(
            [
                f"- {i.title} (status: {i.status}, priority: {i.priority}, assignee: {getattr(i, 'assignee_id', None)}, reporter: {getattr(i, 'reporter_id', None)})"
                for i in issues
            ]
        )
        tags_str = ", ".join([t.name for t in tags])
        users_str = ", ".join([u.username for u in users])
        prompt = f"""
Project Data:
Issues:
{issues_str if issues_str else 'No issues.'}
Tags: {tags_str if tags_str else 'No tags.'}
Users: {users_str if users_str else 'No users.'}

User Question: {question}

Instructions:
- Only answer the user's question directly.
- Do NOT explain your reasoning or list all data.
- If the question is about a count, just give the number and the relevant titles.
- Be as concise as possible. Use markdown if appropriate.
- If the answer is not in the data, say you don't know.
"""
        try:
            ai_result = await ai_enhancer.enhance_description(prompt)
            return ai_result["enhanced_text"]
        except Exception as e:
            print(f"[Chatbot AI Error] {e}")
            return "Sorry, the AI service is currently unavailable. Please try again later."


schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)

gql_app = GraphQLRouter(
    schema,
    context_getter=get_context_dependency,
    subscription_protocols=[GRAPHQL_TRANSPORT_WS_PROTOCOL, GRAPHQL_WS_PROTOCOL],
)

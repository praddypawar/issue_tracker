import strawberry
from typing import Optional, List
from datetime import datetime
from enum import Enum
from app.models.user import UserRole, UserStatus
from app.models.issue import IssueStatus, IssuePriority
from app.models.user_activity import ActivityType


@strawberry.type
class UserType:
    id: int
    email: str
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: UserRole
    status: UserStatus
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime] = None
    assigned_issues_count: Optional[int] = None
    reported_issues_count: Optional[int] = None
    recent_activity: Optional[List["UserActivityType"]] = None


@strawberry.type
class UserActivityType:
    id: int
    activity_type: ActivityType
    description: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime


@strawberry.type
class PermissionType:
    id: int
    user_id: int
    permission_type: str
    granted: bool
    created_at: datetime


@strawberry.type
class TagType:
    id: int
    name: str
    color: Optional[str]


@strawberry.type
class TeamMemberType:
    user_id: int
    invited_by: int
    role: str
    joined_at: datetime


@strawberry.type
class IssueType:
    id: int
    title: str
    description: str
    enhanced_description: Optional[str]
    status: IssueStatus
    priority: IssuePriority
    assignee_id: Optional[int]
    reporter_id: int
    created_at: datetime
    updated_at: datetime
    tags: List[TagType] = strawberry.field(default_factory=list)


@strawberry.input
class IssueCreateInput:
    title: str
    description: str
    status: IssueStatus = IssueStatus.OPEN
    priority: IssuePriority = IssuePriority.MEDIUM
    assignee_id: Optional[int] = None
    reporter_id: int
    tag_ids: Optional[List[int]] = None


@strawberry.input
class IssueUpdateInput:
    id: int
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assignee_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


@strawberry.input
class InviteTeamMemberInput:
    email: str
    role: str


@strawberry.input
class UserCreateInput:
    email: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: str
    role: UserRole = UserRole.MEMBER
    status: UserStatus = UserStatus.ACTIVE


@strawberry.input
class UserUpdateInput:
    id: int
    email: Optional[str] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None


@strawberry.type
class EnhancedDescriptionResult:
    enhanced_text: str
    markdown_html: str
    original: str


@strawberry.type
class IssueUpdateResponse:
    success: bool
    message: str
    issue: Optional[IssueType] = None


@strawberry.type
class UserRoleStats:
    role: str
    count: int


@strawberry.type
class UserStatsType:
    total_users: int
    active_users: int
    new_users_this_month: int
    users_by_role: List[UserRoleStats]
    recent_activity: List[UserActivityType]


@strawberry.type
class IssueStatsType:
    total_issues: int
    open_issues: int
    in_progress_issues: int
    closed_issues: int
    my_assigned_issues: int
    recent_activity: List["UserActivityType"]


@strawberry.type
class CommentType:
    id: int
    issueId: int
    userId: int
    content: str
    createdAt: datetime


@strawberry.input
class CommentCreateInput:
    issueId: int
    userId: int
    content: str


@strawberry.input
class TagCreateInput:
    name: str
    color: Optional[str] = None


@strawberry.input
class TagUpdateInput:
    id: int
    name: Optional[str] = None
    color: Optional[str] = None

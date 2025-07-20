from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user_activity import UserActivity, ActivityType
from app.models.user import User
from app.models.issue import Issue
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json
from app.database import AsyncSessionLocal
from app.graphql.types import UserRoleStats


class UserActivityService:
    @staticmethod
    async def log_activity(
        db: AsyncSession,
        user_id: int,
        activity_type: ActivityType,
        description: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> UserActivity:
        """Log a user activity"""
        activity = UserActivity(
            user_id=user_id,
            activity_type=activity_type,
            description=description,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(activity)
        await db.commit()
        await db.refresh(activity)
        return activity

    @staticmethod
    async def get_user_activities(
        db: AsyncSession,
        user_id: Optional[int] = None,
        activity_type: Optional[ActivityType] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[UserActivity]:
        """Get user activities with optional filtering"""
        query = select(UserActivity)

        if user_id:
            query = query.where(UserActivity.user_id == user_id)

        if activity_type:
            query = query.where(UserActivity.activity_type == activity_type)

        query = query.order_by(UserActivity.created_at.desc())
        query = query.limit(limit).offset(offset)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_recent_activities(
        db: AsyncSession, days: int = 7, limit: int = 20
    ) -> List[UserActivity]:
        """Get recent activities across all users"""
        cutoff_date = datetime.now() - timedelta(days=days)

        query = (
            select(UserActivity)
            .where(UserActivity.created_at >= cutoff_date)
            .order_by(UserActivity.created_at.desc())
            .limit(limit)
        )

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_user_stats(db: AsyncSession, user_id: int) -> Dict[str, Any]:
        """Get comprehensive user statistics"""
        # Get assigned issues count
        assigned_query = select(func.count(Issue.id)).where(
            Issue.assignee_id == user_id
        )
        assigned_result = await db.execute(assigned_query)
        assigned_count = assigned_result.scalar() or 0

        # Get reported issues count
        reported_query = select(func.count(Issue.id)).where(
            Issue.reporter_id == user_id
        )
        reported_result = await db.execute(reported_query)
        reported_count = reported_result.scalar() or 0

        # Get recent activities
        activities_query = (
            select(UserActivity)
            .where(UserActivity.user_id == user_id)
            .order_by(UserActivity.created_at.desc())
            .limit(5)
        )
        activities_result = await db.execute(activities_query)
        recent_activities = activities_result.scalars().all()

        return {
            "assigned_issues_count": assigned_count,
            "reported_issues_count": reported_count,
            "recent_activities": recent_activities,
        }

    @staticmethod
    async def get_team_activity_summary(db: AsyncSession) -> Dict[str, Any]:
        """Get team activity summary (safe: new session per query)"""
        async with AsyncSessionLocal() as session:
            total_users_query = select(func.count(User.id))
            total_users_result = await session.execute(total_users_query)
            total_users = total_users_result.scalar() or 0

        async with AsyncSessionLocal() as session:
            active_cutoff = datetime.now() - timedelta(days=30)
            active_users_query = select(func.count(User.id)).where(
                User.last_login >= active_cutoff
            )
            active_users_result = await session.execute(active_users_query)
            active_users = active_users_result.scalar() or 0

        async with AsyncSessionLocal() as session:
            month_start = datetime.now().replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            new_users_query = select(func.count(User.id)).where(
                User.created_at >= month_start
            )
            new_users_result = await session.execute(new_users_query)
            new_users = new_users_result.scalar() or 0

        async with AsyncSessionLocal() as session:
            role_query = select(User.role, func.count(User.id)).group_by(User.role)
            role_result = await session.execute(role_query)
            users_by_role = [
                UserRoleStats(role=row[0].value, count=row[1])
                for row in role_result.fetchall()
            ]

        recent_activities = await UserActivityService.get_recent_activities(
            db, days=7, limit=10
        )

        return {
            "total_users": total_users,
            "active_users": active_users,
            "new_users_this_month": new_users,
            "users_by_role": users_by_role,
            "recent_activities": recent_activities,
        }

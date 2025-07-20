from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.permission import Permission, PermissionType
from app.models.user import User, UserRole
from typing import List, Dict, Optional
from datetime import datetime


class PermissionService:
    # Default permissions for each role
    DEFAULT_PERMISSIONS = {
        UserRole.ADMIN: [
            PermissionType.CREATE_ISSUE,
            PermissionType.READ_ISSUE,
            PermissionType.UPDATE_ISSUE,
            PermissionType.DELETE_ISSUE,
            PermissionType.ASSIGN_ISSUE,
            PermissionType.CREATE_USER,
            PermissionType.READ_USER,
            PermissionType.UPDATE_USER,
            PermissionType.DELETE_USER,
            PermissionType.MANAGE_ROLES,
            PermissionType.MANAGE_TEAM,
            PermissionType.VIEW_ANALYTICS,
            PermissionType.EXPORT_DATA,
            PermissionType.MANAGE_SETTINGS,
            PermissionType.VIEW_LOGS,
            PermissionType.MANAGE_PERMISSIONS,
        ],
        UserRole.MANAGER: [
            PermissionType.CREATE_ISSUE,
            PermissionType.READ_ISSUE,
            PermissionType.UPDATE_ISSUE,
            PermissionType.ASSIGN_ISSUE,
            PermissionType.READ_USER,
            PermissionType.UPDATE_USER,
            PermissionType.MANAGE_TEAM,
            PermissionType.VIEW_ANALYTICS,
            PermissionType.EXPORT_DATA,
        ],
        UserRole.MEMBER: [
            PermissionType.CREATE_ISSUE,
            PermissionType.READ_ISSUE,
            PermissionType.UPDATE_ISSUE,
            PermissionType.ASSIGN_ISSUE,
            PermissionType.READ_USER,
        ],
        UserRole.VIEWER: [
            PermissionType.READ_ISSUE,
            PermissionType.READ_USER,
        ],
    }

    @staticmethod
    async def initialize_permissions(db: AsyncSession) -> None:
        """Initialize default permissions for all roles"""
        for role, permissions in PermissionService.DEFAULT_PERMISSIONS.items():
            for permission_type in permissions:
                # Check if permission already exists
                existing = await db.execute(
                    select(Permission).where(
                        Permission.role == role.value,
                        Permission.permission_type == permission_type,
                    )
                )
                if not existing.scalar_one_or_none():
                    permission = Permission(
                        role=role.value, permission_type=permission_type, granted=True
                    )
                    db.add(permission)

        await db.commit()

    @staticmethod
    async def get_user_permissions(db: AsyncSession, user_id: int) -> List[Permission]:
        """Get all permissions for a specific user"""
        # Get user's role
        user_query = select(User).where(User.id == user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if not user:
            return []

        # Get permissions for user's role
        permissions_query = select(Permission).where(
            Permission.role == user.role.value, Permission.granted == True
        )
        permissions_result = await db.execute(permissions_query)
        return permissions_result.scalars().all()

    @staticmethod
    async def has_permission(
        db: AsyncSession, user_id: int, permission_type: PermissionType
    ) -> bool:
        """Check if user has a specific permission"""
        user_query = select(User).where(User.id == user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if not user:
            return False

        # Check if permission exists and is granted
        permission_query = select(Permission).where(
            Permission.role == user.role.value,
            Permission.permission_type == permission_type,
            Permission.granted == True,
        )
        permission_result = await db.execute(permission_query)
        return permission_result.scalar_one_or_none() is not None

    @staticmethod
    async def grant_permission(
        db: AsyncSession,
        role: str,
        permission_type: PermissionType,
        granted: bool = True,
    ) -> Permission:
        """Grant or revoke a permission for a role"""
        # Check if permission already exists
        existing_query = select(Permission).where(
            Permission.role == role, Permission.permission_type == permission_type
        )
        existing_result = await db.execute(existing_query)
        existing = existing_result.scalar_one_or_none()

        if existing:
            existing.granted = granted
            existing.updated_at = datetime.now()
            await db.commit()
            await db.refresh(existing)
            return existing
        else:
            permission = Permission(
                role=role, permission_type=permission_type, granted=granted
            )
            db.add(permission)
            await db.commit()
            await db.refresh(permission)
            return permission

    @staticmethod
    async def get_role_permissions(db: AsyncSession, role: str) -> List[Permission]:
        """Get all permissions for a specific role"""
        query = select(Permission).where(Permission.role == role)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def update_user_role(
        db: AsyncSession, user_id: int, new_role: UserRole
    ) -> User:
        """Update a user's role"""
        user_query = select(User).where(User.id == user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()

        if not user:
            raise ValueError("User not found")

        old_role = user.role
        user.role = new_role
        user.updated_at = datetime.now()

        await db.commit()
        await db.refresh(user)

        return user

    @staticmethod
    async def get_permission_summary(db: AsyncSession) -> Dict[str, List[str]]:
        """Get a summary of permissions by role"""
        summary = {}

        for role in UserRole:
            permissions = await PermissionService.get_role_permissions(db, role.value)
            granted_permissions = [
                perm.permission_type.value for perm in permissions if perm.granted
            ]
            summary[role.value] = granted_permissions

        return summary

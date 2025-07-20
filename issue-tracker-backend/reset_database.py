#!/usr/bin/env python3
"""
Database Reset Script
Drops all tables and recreates the schema with enhanced features:
- User roles and permissions
- Activity tracking
- Enhanced user management
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta
from typing import List

# Add the app directory to the Python path
# sys.path.append(os.path.join(os.path.dirname(__file__), "app"))
sys.path.append(os.path.dirname(__file__))

from sqlalchemy import text, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import Base
from app.models.user import User
from app.models.issue import Issue

# from app.models.comment import Comment
from app.models.user_activity import UserActivity
from app.models.permission import Permission
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


async def reset_database():
    """Reset the entire database schema"""
    print("🔄 Starting database reset...")

    # Create async engine
    engine = create_async_engine(
        "postgresql+asyncpg://postgres:1234@localhost:5432/issue_tracker"
    )

    async with engine.begin() as conn:
        print("🗑️  Dropping all tables...")

        # Drop all tables
        await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public"))

        print("✅ All tables dropped successfully")

    # Create all tables
    async with engine.begin() as conn:
        print("🏗️  Creating new schema...")

        # Create enums
        await conn.execute(
            text(
                """
            CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER')
        """
            )
        )

        await conn.execute(
            text(
                """
            CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'AWAY', 'SUSPENDED')
        """
            )
        )

        await conn.execute(
            text(
                """
            CREATE TYPE activity_type AS ENUM (
                'LOGIN', 'LOGOUT', 'CREATE_ISSUE', 'UPDATE_ISSUE', 'DELETE_ISSUE',
                'CREATE_COMMENT', 'UPDATE_COMMENT', 'DELETE_COMMENT',
                'UPDATE_PROFILE', 'CHANGE_ROLE', 'CHANGE_STATUS'
            )
        """
            )
        )

        await conn.execute(
            text(
                """
            CREATE TYPE permission_type AS ENUM (
                'CREATE_ISSUE', 'READ_ISSUE', 'UPDATE_ISSUE', 'DELETE_ISSUE',
                'CREATE_COMMENT', 'READ_COMMENT', 'UPDATE_COMMENT', 'DELETE_COMMENT',
                'MANAGE_USERS', 'MANAGE_ROLES', 'VIEW_ANALYTICS', 'MANAGE_PROJECTS'
            )
        """
            )
        )

        await conn.execute(
            text(
                """
            CREATE TYPE issue_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
        """
            )
        )

        await conn.execute(
            text(
                """
            CREATE TYPE issue_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
        """
            )
        )

        print("✅ Enums created")

        # Create tables
        await conn.execute(
            text(
                """
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                role user_role DEFAULT 'MEMBER',
                status user_status DEFAULT 'ACTIVE',
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        await conn.execute(
            text(
                """
            CREATE TABLE issues (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                status issue_status DEFAULT 'OPEN',
                priority issue_priority DEFAULT 'MEDIUM',
                created_by INTEGER REFERENCES users(id),
                assigned_to INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        await conn.execute(
            text(
                """
            CREATE TABLE comments (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        await conn.execute(
            text(
                """
            CREATE TABLE user_activities (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                activity_type activity_type NOT NULL,
                details JSONB,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
            )
        )

        await conn.execute(
            text(
                """
            CREATE TABLE permissions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                permission_type permission_type NOT NULL,
                granted BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, permission_type)
            )
        """
            )
        )

        print("✅ Tables created")

        # Create indexes
        await conn.execute(text("CREATE INDEX idx_users_email ON users(email)"))
        await conn.execute(text("CREATE INDEX idx_users_username ON users(username)"))
        await conn.execute(text("CREATE INDEX idx_users_role ON users(role)"))
        await conn.execute(text("CREATE INDEX idx_users_status ON users(status)"))
        await conn.execute(text("CREATE INDEX idx_issues_status ON issues(status)"))
        await conn.execute(text("CREATE INDEX idx_issues_priority ON issues(priority)"))
        await conn.execute(
            text("CREATE INDEX idx_issues_created_by ON issues(created_by)")
        )
        await conn.execute(
            text("CREATE INDEX idx_issues_assigned_to ON issues(assigned_to)")
        )
        await conn.execute(
            text("CREATE INDEX idx_comments_issue_id ON comments(issue_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_comments_user_id ON comments(user_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_user_activities_user_id ON user_activities(user_id)")
        )
        await conn.execute(
            text(
                "CREATE INDEX idx_user_activities_created_at ON user_activities(created_at)"
            )
        )
        await conn.execute(
            text("CREATE INDEX idx_permissions_user_id ON permissions(user_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_permissions_type ON permissions(permission_type)")
        )

        print("✅ Indexes created")

    # Insert sample data
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        print("🌱 Seeding sample data...")

        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@example.com",
            full_name="System Administrator",
            hashed_password=get_password_hash("admin123"),
            role="ADMIN",
            status="ACTIVE",
        )
        session.add(admin_user)
        await session.flush()

        # Create manager user
        manager_user = User(
            username="manager",
            email="manager@example.com",
            full_name="Project Manager",
            hashed_password=get_password_hash("manager123"),
            role="MANAGER",
            status="ACTIVE",
        )
        session.add(manager_user)
        await session.flush()

        # Create member users
        member1 = User(
            username="john_doe",
            email="john@example.com",
            full_name="John Doe",
            hashed_password=get_password_hash("password123"),
            role="MEMBER",
            status="ACTIVE",
        )
        session.add(member1)

        member2 = User(
            username="jane_smith",
            email="jane@example.com",
            full_name="Jane Smith",
            hashed_password=get_password_hash("password123"),
            role="MEMBER",
            status="ACTIVE",
        )
        session.add(member2)

        viewer_user = User(
            username="viewer",
            email="viewer@example.com",
            full_name="Read Only User",
            hashed_password=get_password_hash("password123"),
            role="VIEWER",
            status="ACTIVE",
        )
        session.add(viewer_user)

        await session.flush()

        # Create sample issues
        issue1 = Issue(
            title="Fix login authentication bug",
            description="Users are experiencing issues with login authentication. Need to investigate and fix the problem.",
            status="OPEN",
            priority="HIGH",
            created_by=admin_user.id,
            assigned_to=member1.id,
        )
        session.add(issue1)

        issue2 = Issue(
            title="Add dark mode feature",
            description="Implement dark mode toggle for better user experience.",
            status="IN_PROGRESS",
            priority="MEDIUM",
            created_by=manager_user.id,
            assigned_to=member2.id,
        )
        session.add(issue2)

        issue3 = Issue(
            title="Update documentation",
            description="Update API documentation with new endpoints and examples.",
            status="RESOLVED",
            priority="LOW",
            created_by=member1.id,
            assigned_to=member1.id,
        )
        session.add(issue3)

        await session.flush()

        # # Create sample comments
        # comment1 = Comment(
        #     content="I've started investigating the authentication issue. Will update once I find the root cause.",
        #     issue_id=issue1.id,
        #     user_id=member1.id,
        # )
        # session.add(comment1)

        # comment2 = Comment(
        #     content="Great work! Let me know if you need any help with the investigation.",
        #     issue_id=issue1.id,
        #     user_id=manager_user.id,
        # )
        # session.add(comment2)

        # comment3 = Comment(
        #     content="Dark mode implementation is 70% complete. Should be ready for testing by end of week.",
        #     issue_id=issue2.id,
        #     user_id=member2.id,
        # )
        # session.add(comment3)

        # Create sample activities
        activities = [
            UserActivity(
                user_id=admin_user.id,
                activity_type="LOGIN",
                details={"ip": "192.168.1.100", "browser": "Chrome"},
            ),
            UserActivity(
                user_id=manager_user.id,
                activity_type="CREATE_ISSUE",
                details={"issue_id": issue2.id, "title": issue2.title},
            ),
            UserActivity(
                user_id=member1.id,
                activity_type="UPDATE_ISSUE",
                details={"issue_id": issue1.id, "status": "IN_PROGRESS"},
            ),
            UserActivity(
                user_id=member2.id,
                activity_type="CREATE_COMMENT",
                details={"issue_id": issue2.id, "comment_id": comment3.id},
            ),
        ]

        for activity in activities:
            session.add(activity)

        # Create default permissions for each user
        permission_types = [
            "CREATE_ISSUE",
            "READ_ISSUE",
            "UPDATE_ISSUE",
            "DELETE_ISSUE",
            "CREATE_COMMENT",
            "READ_COMMENT",
            "UPDATE_COMMENT",
            "DELETE_COMMENT",
            "MANAGE_USERS",
            "MANAGE_ROLES",
            "VIEW_ANALYTICS",
            "MANAGE_PROJECTS",
        ]

        # Admin gets all permissions
        for perm_type in permission_types:
            perm = Permission(
                user_id=admin_user.id, permission_type=perm_type, granted=True
            )
            session.add(perm)

        # Manager gets most permissions except user management
        manager_permissions = [
            p for p in permission_types if p not in ["MANAGE_USERS", "MANAGE_ROLES"]
        ]
        for perm_type in manager_permissions:
            perm = Permission(
                user_id=manager_user.id, permission_type=perm_type, granted=True
            )
            session.add(perm)

        # Members get basic permissions
        member_permissions = [
            "CREATE_ISSUE",
            "READ_ISSUE",
            "UPDATE_ISSUE",
            "CREATE_COMMENT",
            "READ_COMMENT",
            "UPDATE_COMMENT",
        ]
        for perm_type in member_permissions:
            perm = Permission(
                user_id=member1.id, permission_type=perm_type, granted=True
            )
            session.add(perm)
            perm2 = Permission(
                user_id=member2.id, permission_type=perm_type, granted=True
            )
            session.add(perm2)

        # Viewer gets read-only permissions
        viewer_permissions = ["READ_ISSUE", "READ_COMMENT"]
        for perm_type in viewer_permissions:
            perm = Permission(
                user_id=viewer_user.id, permission_type=perm_type, granted=True
            )
            session.add(perm)

        await session.commit()
        print("✅ Sample data seeded successfully")

    await engine.dispose()
    print("🎉 Database reset completed successfully!")
    print("\n📋 Sample Users:")
    print("  Admin: admin / admin123")
    print("  Manager: manager / manager123")
    print("  Member: john_doe / password123")
    print("  Member: jane_smith / password123")
    print("  Viewer: viewer / password123")


if __name__ == "__main__":
    asyncio.run(reset_database())

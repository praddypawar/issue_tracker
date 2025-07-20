#!/usr/bin/env python3
"""
Drop and Create Database Script
Completely drops all tables and recreates the schema with enhanced features:
- User roles and permissions
- Activity tracking
- Enhanced user management
- Tags and team management
"""

import asyncio
import os
import sys
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings


async def drop_and_create_database():
    """Drop all tables and recreate the database schema"""
    print("🗑️  Dropping all database tables...")

    # Create async engine with proper async driver
    DATABASE_URL = settings.DATABASE_URL.replace(
        "postgresql://", "postgresql+asyncpg://"
    )
    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
        future=True,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_reset_on_return="commit",
    )

    # Drop all tables and recreate schema
    async with engine.begin() as conn:
        print("🗑️  Dropping all tables...")

        # Drop all tables
        await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public"))

        print("✅ All tables dropped successfully")

    # Create enums in separate transactions
    print("🏗️  Creating enums...")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                "CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER')"
            )
        )
        print("✅ user_role enum created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                "CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'AWAY', 'SUSPENDED')"
            )
        )
        print("✅ user_status enum created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TYPE activity_type AS ENUM (
                    'LOGIN', 'LOGOUT', 'CREATE_ISSUE', 'UPDATE_ISSUE', 'DELETE_ISSUE',
                    'CREATE_COMMENT', 'UPDATE_COMMENT', 'DELETE_COMMENT',
                    'UPDATE_PROFILE', 'CHANGE_ROLE', 'CHANGE_STATUS',
                    'CREATE_USER', 'USER_UPDATED'
                )
            """
            )
        )
        print("✅ activity_type enum created")

    async with engine.begin() as conn:
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
        print("✅ permission_type enum created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                "CREATE TYPE issue_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')"
            )
        )
        print("✅ issue_status enum created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                "CREATE TYPE issue_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')"
            )
        )
        print("✅ issue_priority enum created")

    print("✅ All enums created")

    # Create tables
    print("🏗️  Creating tables...")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    first_name VARCHAR(50),
                    last_name VARCHAR(50),
                    password_hash VARCHAR(255) NOT NULL,
                    role user_role DEFAULT 'MEMBER',
                    status user_status DEFAULT 'ACTIVE',
                    last_login TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
            )
        )
        print("✅ users table created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE issues (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    enhanced_description TEXT,
                    status issue_status DEFAULT 'OPEN',
                    priority issue_priority DEFAULT 'MEDIUM',
                    assignee_id INTEGER REFERENCES users(id),
                    reporter_id INTEGER REFERENCES users(id) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
            )
        )
        print("✅ issues table created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE comments (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL,
                    issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
            )
        )
        print("✅ comments table created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE tags (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    color VARCHAR(7) DEFAULT '#6B7280'
                )
            """
            )
        )
        print("✅ tags table created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE issue_tags (
                    issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
                    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                    PRIMARY KEY (issue_id, tag_id)
                )
            """
            )
        )
        print("✅ issue_tags junction table created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE team_members (
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    invited_by INTEGER REFERENCES users(id) NOT NULL,
                    role VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id)
                )
            """
            )
        )
        print("✅ team_members table created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE user_activities (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    activity_type activity_type NOT NULL,
                    description VARCHAR(255) NOT NULL,
                    details JSONB,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
            )
        )
        print("✅ user_activities table created")

    async with engine.begin() as conn:
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
        print("✅ permissions table created")

    # Create indexes
    print("🏗️  Creating indexes...")

    async with engine.begin() as conn:
        await conn.execute(text("CREATE INDEX idx_users_email ON users(email)"))
        await conn.execute(text("CREATE INDEX idx_users_username ON users(username)"))
        await conn.execute(text("CREATE INDEX idx_users_role ON users(role)"))
        await conn.execute(text("CREATE INDEX idx_users_status ON users(status)"))
        await conn.execute(text("CREATE INDEX idx_issues_status ON issues(status)"))
        await conn.execute(text("CREATE INDEX idx_issues_priority ON issues(priority)"))
        await conn.execute(
            text("CREATE INDEX idx_issues_created_by ON issues(reporter_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_issues_assigned_to ON issues(assignee_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_comments_issue_id ON comments(issue_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_comments_user_id ON comments(user_id)")
        )
        await conn.execute(text("CREATE INDEX idx_tags_name ON tags(name)"))
        await conn.execute(
            text("CREATE INDEX idx_issue_tags_issue_id ON issue_tags(issue_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_issue_tags_tag_id ON issue_tags(tag_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_team_members_user_id ON team_members(user_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_team_members_invited_by ON team_members(invited_by)")
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
        print("✅ All indexes created")

    await engine.dispose()
    print("🎉 Database completely recreated successfully!")
    print("\n📋 Created Tables:")
    print("  - users (with roles, status, activity tracking)")
    print("  - issues (with priorities, assignments)")
    print("  - comments (with user tracking)")
    print("  - tags (for issue categorization)")
    print("  - issue_tags (junction table for issue-tag relationships)")
    print("  - team_members (team management)")
    print("  - user_activities (activity logging)")
    print("  - permissions (role-based access control)")
    print("\n🔗 API Documentation:")
    print("  Swagger UI: http://localhost:8000/docs")
    print("  ReDoc: http://localhost:8000/redoc")
    print("\n✅ Your database is now ready for the enhanced features!")


if __name__ == "__main__":
    asyncio.run(drop_and_create_database())

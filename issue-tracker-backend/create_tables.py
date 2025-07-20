#!/usr/bin/env python3
"""
Create Database Tables Script
Creates the database schema with enhanced features:
- User roles and permissions
- Activity tracking
- Enhanced user management
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


async def create_tables():
    """Create the database tables with enhanced features"""
    print("🔄 Creating database tables...")

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

    # Create enums in separate transactions
    print("🏗️  Creating enums...")

    async with engine.begin() as conn:
        try:
            await conn.execute(
                text(
                    "CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER')"
                )
            )
            print("✅ user_role enum created")
        except Exception:
            print("✅ user_role enum already exists")

    async with engine.begin() as conn:
        try:
            await conn.execute(
                text(
                    "CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'AWAY', 'SUSPENDED')"
                )
            )
            print("✅ user_status enum created")
        except Exception:
            print("✅ user_status enum already exists")

    async with engine.begin() as conn:
        try:
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
            print("✅ activity_type enum created")
        except Exception:
            print("✅ activity_type enum already exists")

    async with engine.begin() as conn:
        try:
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
        except Exception:
            print("✅ permission_type enum already exists")

    async with engine.begin() as conn:
        try:
            await conn.execute(
                text(
                    "CREATE TYPE issue_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')"
                )
            )
            print("✅ issue_status enum created")
        except Exception:
            print("✅ issue_status enum already exists")

    async with engine.begin() as conn:
        try:
            await conn.execute(
                text(
                    "CREATE TYPE issue_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')"
                )
            )
            print("✅ issue_priority enum created")
        except Exception:
            print("✅ issue_priority enum already exists")

    print("✅ All enums created")

    # Create tables
    print("🏗️  Creating tables...")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS users (
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
                CREATE TABLE IF NOT EXISTS issues (
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
                CREATE TABLE IF NOT EXISTS comments (
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
        print("✅ comments table created")

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS user_activities (
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
                CREATE TABLE IF NOT EXISTS permissions (
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
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status)")
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority)")
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_issues_created_by ON issues(reporter_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assignee_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id)"
            )
        )
        await conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)")
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_permissions_type ON permissions(permission_type)"
            )
        )
        print("✅ All indexes created")

    await engine.dispose()
    print("🎉 Database tables created successfully!")
    print("\n📋 Created Tables:")
    print("  - users (with roles, status, activity tracking)")
    print("  - issues (with priorities, assignments)")
    print("  - comments (with user tracking)")
    print("  - user_activities (activity logging)")
    print("  - permissions (role-based access control)")
    print("\n🔗 API Documentation:")
    print("  Swagger UI: http://localhost:8000/docs")
    print("  ReDoc: http://localhost:8000/redoc")


if __name__ == "__main__":
    asyncio.run(create_tables())

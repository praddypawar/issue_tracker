"""Add user roles, status, activity tracking, and permissions

Revision ID: 003
Revises: 002
Create Date: 2024-01-20 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "003"
down_revision = "ef67b41b525c"
branch_labels = None
depends_on = None


def upgrade():
    # Skip enum creation since they already exist
    # op.execute("DO $$ BEGIN CREATE TYPE userrole AS ENUM ('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    # op.execute("DO $$ BEGIN CREATE TYPE userstatus AS ENUM ('ACTIVE', 'INACTIVE', 'AWAY', 'SUSPENDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    # op.execute("DO $$ BEGIN CREATE TYPE activitytype AS ENUM ('LOGIN', 'LOGOUT', 'ISSUE_CREATED', 'ISSUE_UPDATED', 'ISSUE_DELETED', 'ISSUE_ASSIGNED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'ROLE_CHANGED', 'STATUS_CHANGED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    # op.execute("DO $$ BEGIN CREATE TYPE permissiontype AS ENUM ('CREATE_ISSUE', 'READ_ISSUE', 'UPDATE_ISSUE', 'DELETE_ISSUE', 'ASSIGN_ISSUE', 'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'MANAGE_ROLES', 'MANAGE_TEAM', 'VIEW_ANALYTICS', 'EXPORT_DATA', 'MANAGE_SETTINGS', 'VIEW_LOGS', 'MANAGE_PERMISSIONS'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    # Add new columns to users table
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.Enum("ADMIN", "MANAGER", "MEMBER", "VIEWER", name="userrole"),
            nullable=False,
            server_default="MEMBER",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "INACTIVE", "AWAY", "SUSPENDED", name="userstatus"),
            nullable=False,
            server_default="ACTIVE",
        ),
    )
    op.add_column(
        "users", sa.Column("last_login", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
        ),
    )

    # Create user_activities table
    op.create_table(
        "user_activities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "activity_type",
            sa.Enum(
                "LOGIN",
                "LOGOUT",
                "ISSUE_CREATED",
                "ISSUE_UPDATED",
                "ISSUE_DELETED",
                "ISSUE_ASSIGNED",
                "USER_CREATED",
                "USER_UPDATED",
                "USER_DELETED",
                "ROLE_CHANGED",
                "STATUS_CHANGED",
                "PERMISSION_GRANTED",
                "PERMISSION_REVOKED",
                name="activitytype",
            ),
            nullable=False,
        ),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_user_activities_id"), "user_activities", ["id"], unique=False
    )

    # Create permissions table
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column(
            "permission_type",
            sa.Enum(
                "CREATE_ISSUE",
                "READ_ISSUE",
                "UPDATE_ISSUE",
                "DELETE_ISSUE",
                "ASSIGN_ISSUE",
                "CREATE_USER",
                "READ_USER",
                "UPDATE_USER",
                "DELETE_USER",
                "MANAGE_ROLES",
                "MANAGE_TEAM",
                "VIEW_ANALYTICS",
                "EXPORT_DATA",
                "MANAGE_SETTINGS",
                "VIEW_LOGS",
                "MANAGE_PERMISSIONS",
                name="permissiontype",
            ),
            nullable=False,
        ),
        sa.Column("granted", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_permissions_id"), "permissions", ["id"], unique=False)
    op.create_index(op.f("ix_permissions_role"), "permissions", ["role"], unique=False)

    # Insert default permissions (only if they don't exist)
    default_permissions = [
        # Admin permissions
        ("ADMIN", "CREATE_ISSUE", True),
        ("ADMIN", "READ_ISSUE", True),
        ("ADMIN", "UPDATE_ISSUE", True),
        ("ADMIN", "DELETE_ISSUE", True),
        ("ADMIN", "ASSIGN_ISSUE", True),
        ("ADMIN", "CREATE_USER", True),
        ("ADMIN", "READ_USER", True),
        ("ADMIN", "UPDATE_USER", True),
        ("ADMIN", "DELETE_USER", True),
        ("ADMIN", "MANAGE_ROLES", True),
        ("ADMIN", "MANAGE_TEAM", True),
        ("ADMIN", "VIEW_ANALYTICS", True),
        ("ADMIN", "EXPORT_DATA", True),
        ("ADMIN", "MANAGE_SETTINGS", True),
        ("ADMIN", "VIEW_LOGS", True),
        ("ADMIN", "MANAGE_PERMISSIONS", True),
        # Manager permissions
        ("MANAGER", "CREATE_ISSUE", True),
        ("MANAGER", "READ_ISSUE", True),
        ("MANAGER", "UPDATE_ISSUE", True),
        ("MANAGER", "ASSIGN_ISSUE", True),
        ("MANAGER", "READ_USER", True),
        ("MANAGER", "UPDATE_USER", True),
        ("MANAGER", "MANAGE_TEAM", True),
        ("MANAGER", "VIEW_ANALYTICS", True),
        ("MANAGER", "EXPORT_DATA", True),
        # Member permissions
        ("MEMBER", "CREATE_ISSUE", True),
        ("MEMBER", "READ_ISSUE", True),
        ("MEMBER", "UPDATE_ISSUE", True),
        ("MEMBER", "ASSIGN_ISSUE", True),
        ("MEMBER", "READ_USER", True),
        # Viewer permissions
        ("VIEWER", "READ_ISSUE", True),
        ("VIEWER", "READ_USER", True),
    ]

    for role, permission_type, granted in default_permissions:
        op.execute(
            f"INSERT INTO permissions (role, permission_type, granted) VALUES ('{role}', '{permission_type}', {granted}) ON CONFLICT DO NOTHING"
        )


def downgrade():
    # Drop tables
    op.drop_index(op.f("ix_permissions_role"), table_name="permissions")
    op.drop_index(op.f("ix_permissions_id"), table_name="permissions")
    op.drop_table("permissions")

    op.drop_index(op.f("ix_user_activities_id"), table_name="user_activities")
    op.drop_table("user_activities")

    # Drop columns from users table
    op.drop_column("users", "updated_at")
    op.drop_column("users", "last_login")
    op.drop_column("users", "status")
    op.drop_column("users", "role")

    # Drop enum types
    op.execute("DROP TYPE permissiontype")
    op.execute("DROP TYPE activitytype")
    op.execute("DROP TYPE userstatus")
    op.execute("DROP TYPE userrole")

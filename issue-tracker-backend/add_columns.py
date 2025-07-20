from app.database import engine
from sqlalchemy import text


def add_columns():
    with engine.connect() as conn:
        # Add columns to users table
        conn.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'MEMBER'"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'ACTIVE'"
            )
        )
        conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP")
        )
        conn.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()"
            )
        )

        # Create user_activities table if it doesn't exist
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS user_activities (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                activity_type VARCHAR NOT NULL,
                description VARCHAR NOT NULL,
                details JSON,
                ip_address VARCHAR,
                user_agent VARCHAR,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """
            )
        )

        # Create permissions table if it doesn't exist
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS permissions (
                id SERIAL PRIMARY KEY,
                role VARCHAR NOT NULL,
                permission_type VARCHAR NOT NULL,
                granted BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """
            )
        )

        # Insert default permissions
        default_permissions = [
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
            ("MANAGER", "CREATE_ISSUE", True),
            ("MANAGER", "READ_ISSUE", True),
            ("MANAGER", "UPDATE_ISSUE", True),
            ("MANAGER", "ASSIGN_ISSUE", True),
            ("MANAGER", "READ_USER", True),
            ("MANAGER", "UPDATE_USER", True),
            ("MANAGER", "MANAGE_TEAM", True),
            ("MANAGER", "VIEW_ANALYTICS", True),
            ("MANAGER", "EXPORT_DATA", True),
            ("MEMBER", "CREATE_ISSUE", True),
            ("MEMBER", "READ_ISSUE", True),
            ("MEMBER", "UPDATE_ISSUE", True),
            ("MEMBER", "ASSIGN_ISSUE", True),
            ("MEMBER", "READ_USER", True),
            ("VIEWER", "READ_ISSUE", True),
            ("VIEWER", "READ_USER", True),
        ]

        for role, permission_type, granted in default_permissions:
            conn.execute(
                text(
                    f"INSERT INTO permissions (role, permission_type, granted) VALUES ('{role}', '{permission_type}', {granted}) ON CONFLICT DO NOTHING"
                )
            )

        conn.commit()
        print("Columns and tables added successfully!")


if __name__ == "__main__":
    add_columns()

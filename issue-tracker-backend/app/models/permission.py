from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    func,
    ForeignKey,
    Boolean,
    Enum,
)
from sqlalchemy.orm import relationship
from app.models import Base
import enum


class PermissionType(enum.Enum):
    # Issue permissions
    CREATE_ISSUE = "CREATE_ISSUE"
    READ_ISSUE = "READ_ISSUE"
    UPDATE_ISSUE = "UPDATE_ISSUE"
    DELETE_ISSUE = "DELETE_ISSUE"

    # Comment permissions
    CREATE_COMMENT = "CREATE_COMMENT"
    READ_COMMENT = "READ_COMMENT"
    UPDATE_COMMENT = "UPDATE_COMMENT"
    DELETE_COMMENT = "DELETE_COMMENT"

    # User management permissions
    MANAGE_USERS = "MANAGE_USERS"
    MANAGE_ROLES = "MANAGE_ROLES"

    # System permissions
    VIEW_ANALYTICS = "VIEW_ANALYTICS"
    MANAGE_PROJECTS = "MANAGE_PROJECTS"
    ASSIGN_ISSUE = "ASSIGN_ISSUE"

    CREATE_USER = "CREATE_USER"
    READ_USER = "READ_USER"
    UPDATE_USER = "UPDATE_USER"
    DELETE_USER = "DELETE_USER"
    MANAGE_TEAM = "MANAGE_TEAM"
    EXPORT_DATA = "EXPORT_DATA"
    MANAGE_SETTINGS = "MANAGE_SETTINGS"
    VIEW_LOGS = "VIEW_LOGS"
    MANAGE_PERMISSIONS = "MANAGE_PERMISSIONS"


class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    permission_type = Column(
        Enum(PermissionType, name="permission_type"), nullable=False
    )
    granted = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Unique constraint
    __table_args__ = {"schema": None}

    # Relationships
    user = relationship("User", back_populates="permissions")

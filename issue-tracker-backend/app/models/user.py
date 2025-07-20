from sqlalchemy import Column, Integer, String, DateTime, func, Enum
from sqlalchemy.orm import relationship
from app.models import Base
import enum


class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"


class UserStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    AWAY = "AWAY"
    SUSPENDED = "SUSPENDED"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    role = Column(
        Enum(UserRole, name="user_role"), default=UserRole.MEMBER, nullable=False
    )
    status = Column(
        Enum(UserStatus, name="user_status"), default=UserStatus.ACTIVE, nullable=False
    )
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    assigned_issues = relationship(
        "Issue", foreign_keys="Issue.assignee_id", back_populates="assignee"
    )
    reported_issues = relationship(
        "Issue", foreign_keys="Issue.reporter_id", back_populates="reporter"
    )
    activities = relationship("UserActivity", back_populates="user")
    permissions = relationship("Permission", back_populates="user")

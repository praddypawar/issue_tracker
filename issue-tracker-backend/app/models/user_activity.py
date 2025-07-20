from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from app.models import Base
import enum


class ActivityType(enum.Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    CREATE_ISSUE = "CREATE_ISSUE"
    UPDATE_ISSUE = "UPDATE_ISSUE"
    DELETE_ISSUE = "DELETE_ISSUE"
    CREATE_COMMENT = "CREATE_COMMENT"
    UPDATE_COMMENT = "UPDATE_COMMENT"
    DELETE_COMMENT = "DELETE_COMMENT"
    UPDATE_PROFILE = "UPDATE_PROFILE"
    CHANGE_ROLE = "CHANGE_ROLE"
    CHANGE_STATUS = "CHANGE_STATUS"
    CREATE_USER = "CREATE_USER"
    USER_UPDATED = "USER_UPDATED"


class UserActivity(Base):
    __tablename__ = "user_activities"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(Enum(ActivityType, name="activity_type"), nullable=False)
    description = Column(String, nullable=False)
    details = Column(JSON, nullable=True)  # Store additional activity details
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="activities")

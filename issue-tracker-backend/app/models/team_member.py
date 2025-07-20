from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.models import Base


class TeamMember(Base):
    __tablename__ = "team_members"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    inviter = relationship("User", foreign_keys=[invited_by])

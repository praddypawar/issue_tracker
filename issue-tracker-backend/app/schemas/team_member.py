from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TeamMemberBase(BaseModel):
    user_id: int
    invited_by: int
    role: str


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberRead(TeamMemberBase):
    joined_at: datetime

    class Config:
        orm_mode = True

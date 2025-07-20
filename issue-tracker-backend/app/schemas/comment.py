from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    issue_id: int
    user_id: int


class CommentRead(CommentBase):
    id: int
    issue_id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

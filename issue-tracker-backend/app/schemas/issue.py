from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.issue import IssueStatus, IssuePriority


class IssueBase(BaseModel):
    title: str
    description: str
    status: IssueStatus = IssueStatus.OPEN
    priority: IssuePriority = IssuePriority.MEDIUM
    assignee_id: Optional[int] = None


class IssueCreate(IssueBase):
    pass


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assignee_id: Optional[int] = None


class IssueRead(IssueBase):
    id: int
    enhanced_description: Optional[str] = None
    reporter_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

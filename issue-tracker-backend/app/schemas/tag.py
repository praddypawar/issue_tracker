from pydantic import BaseModel
from typing import Optional


class TagBase(BaseModel):
    name: str
    color: Optional[str] = None


class TagCreate(TagBase):
    pass


class TagRead(TagBase):
    id: int

    class Config:
        orm_mode = True

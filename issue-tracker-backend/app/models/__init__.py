from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from .user import User
from .issue import Issue
from .tag import Tag
from .team_member import TeamMember
from .comment import Comment
from .user_activity import UserActivity

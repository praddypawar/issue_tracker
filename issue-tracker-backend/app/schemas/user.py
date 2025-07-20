from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    AWAY = "AWAY"
    SUSPENDED = "SUSPENDED"


class UserBase(BaseModel):
    email: EmailStr = Field(
        ..., description="User's email address", example="user@example.com"
    )
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Unique username",
        example="john_doe",
    )
    first_name: Optional[str] = Field(
        None, max_length=50, description="User's first name", example="John"
    )
    last_name: Optional[str] = Field(
        None, max_length=50, description="User's last name", example="Doe"
    )


class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=6,
        description="User's password (minimum 6 characters)",
        example="password123",
    )
    role: UserRole = Field(
        default=UserRole.MEMBER, description="User's role in the system"
    )
    status: UserStatus = Field(
        default=UserStatus.ACTIVE, description="User's current status"
    )


class UserLogin(BaseModel):
    email: EmailStr = Field(
        ..., description="User's email address", example="user@example.com"
    )
    password: str = Field(..., description="User's password", example="password123")


class UserRead(UserBase):
    id: int = Field(..., description="Unique user ID")
    role: UserRole = Field(..., description="User's role in the system")
    status: UserStatus = Field(..., description="User's current status")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(None, description="User's email address")
    username: Optional[str] = Field(
        None, min_length=3, max_length=50, description="Unique username"
    )
    first_name: Optional[str] = Field(
        None, max_length=50, description="User's first name"
    )
    last_name: Optional[str] = Field(
        None, max_length=50, description="User's last name"
    )
    role: Optional[UserRole] = Field(None, description="User's role in the system")
    status: Optional[UserStatus] = Field(None, description="User's current status")


class UserInDB(UserRead):
    password_hash: str = Field(..., description="Hashed password")


class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class RegisterResponse(BaseModel):
    message: str = Field(..., description="Success message")
    user: UserRead = Field(..., description="Created user information")
    access_token: str = Field(..., description="JWT access token for immediate login")

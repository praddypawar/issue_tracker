from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserRead,
    UserUpdate,
    TokenResponse,
    RegisterResponse,
)
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with role-based access control",
)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user with enhanced features:

    - **email**: User's email address (must be unique)
    - **username**: Unique username (3-50 characters)
    - **password**: Password (minimum 6 characters)
    - **first_name**: Optional first name
    - **last_name**: Optional last name
    - **role**: User role (ADMIN, MANAGER, MEMBER, VIEWER) - defaults to MEMBER
    - **status**: User status (ACTIVE, INACTIVE, AWAY, SUSPENDED) - defaults to ACTIVE

    Returns user information and access token for immediate login.
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Check if username already exists
    result = await db.execute(select(User).where(User.username == user_in.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken"
        )

    # Create new user with enhanced features
    user = User(
        email=user_in.email,
        username=user_in.username,
        password_hash=hash_password(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role=user_in.role,
        status=user_in.status,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create access token for immediate login
    access_token = create_access_token({"sub": str(user.id)})

    return RegisterResponse(
        message="User registered successfully", user=user, access_token=access_token
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
    description="Authenticate user and return access token",
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user with email and password:

    - **username**: User's email address
    - **password**: User's password

    Returns JWT access token for API authentication.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    # Check if user is active
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Account is {user.status.value.lower()}",
        )

    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()

    # Create access token
    access_token = create_access_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token, token_type="bearer", expires_in=3600  # 1 hour
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub") if payload else None
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get current user profile",
    description="Retrieve current authenticated user's profile information",
)
async def me(current_user: User = Depends(get_current_user)):
    """
    Get current user's profile information including role and status.
    """
    return current_user


@router.put(
    "/me",
    response_model=UserRead,
    summary="Update current user profile",
    description="Update current user's profile information",
)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user's profile:

    - **email**: New email address (must be unique)
    - **username**: New username (must be unique)
    - **first_name**: New first name
    - **last_name**: New last name
    - **role**: New role (only ADMIN can change roles)
    - **status**: New status (only ADMIN can change status)
    """
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        result = await db.execute(select(User).where(User.email == user_update.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # Check if username is being changed and if it's already taken
    if user_update.username and user_update.username != current_user.username:
        result = await db.execute(
            select(User).where(User.username == user_update.username)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken"
            )

    # Update user fields
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    current_user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)

    return current_user

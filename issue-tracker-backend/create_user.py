import asyncio
from app.database import AsyncSessionLocal
from app.models.user import User
from app.services.auth import get_password_hash


async def create_test_user():
    async with AsyncSessionLocal() as session:
        # Check if user already exists
        from sqlalchemy import select

        result = await session.execute(
            select(User).where(User.email == "test@example.com")
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print("User already exists, updating password...")
            existing_user.password_hash = get_password_hash("password123")
            await session.commit()
            print("Password updated successfully!")
        else:
            # Create new user
            user = User(
                email="test@example.com",
                username="testuser",
                password_hash=get_password_hash("password123"),
                first_name="Test",
                last_name="User",
            )
            session.add(user)
            await session.commit()
            print("Test user created successfully!")

        # Also update the existing pradip user
        result = await session.execute(
            select(User).where(User.email == "pradip@gmail.com")
        )
        pradip_user = result.scalar_one_or_none()
        if pradip_user:
            pradip_user.password_hash = get_password_hash("password123")
            await session.commit()
            print("Pradip user password updated!")


if __name__ == "__main__":
    asyncio.run(create_test_user())

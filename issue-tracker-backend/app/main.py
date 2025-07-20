from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, websocket
from app.graphql import gql_app

app = FastAPI(
    title="Mini Issue Tracker API",
    description="""
    ## Mini Issue Tracker API
    
    A comprehensive issue tracking system with role-based access control, activity tracking, and real-time collaboration.
    
    ### Features:
    - **User Management**: Register, login, and manage user profiles with roles and status
    - **Issue Tracking**: Create, update, and track issues with priorities and assignments
    - **Role-Based Access Control**: ADMIN, MANAGER, MEMBER, and VIEWER roles
    - **Activity Tracking**: Monitor user activities and system events
    - **Real-time Updates**: WebSocket support for live collaboration
    - **GraphQL API**: Full GraphQL interface for flexible data queries
    
    ### Authentication:
    - JWT-based authentication
    - Role-based permissions
    - User status management (ACTIVE, INACTIVE, AWAY, SUSPENDED)
    
    ### API Endpoints:
    - `/auth/*` - Authentication endpoints
    - `/graphql` - GraphQL interface
    - `/ws` - WebSocket for real-time updates
    """,
    version="1.0.0",
    contact={
        "name": "Mini Issue Tracker Team",
        "email": "support@issue-tracker.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(websocket.router)
app.include_router(gql_app, prefix="/graphql")


@app.get(
    "/",
    summary="Health Check",
    description="Check if the API is running",
    tags=["Health"],
)
async def health_check():
    """
    Health check endpoint to verify API status.

    Returns:
        dict: API status information
    """
    return {
        "status": "ok",
        "message": "Mini Issue Tracker API is running",
        "version": "1.0.0",
        "features": [
            "User Management",
            "Issue Tracking",
            "Role-Based Access Control",
            "Activity Tracking",
            "Real-time Updates",
            "GraphQL API",
        ],
    }


@app.get(
    "/info",
    summary="API Information",
    description="Get detailed API information and available features",
    tags=["Info"],
)
async def api_info():
    """
    Get detailed information about the API and its capabilities.

    Returns:
        dict: Detailed API information
    """
    return {
        "name": "Mini Issue Tracker API",
        "version": "1.0.0",
        "description": "A comprehensive issue tracking system with role-based access control",
        "endpoints": {
            "auth": {
                "register": "POST /auth/register - Register new user",
                "login": "POST /auth/login - User authentication",
                "me": "GET /auth/me - Get current user profile",
                "update_profile": "PUT /auth/me - Update user profile",
            },
            "graphql": {"endpoint": "POST /graphql - GraphQL interface"},
            "websocket": {"endpoint": "GET /ws - Real-time updates"},
        },
        "features": {
            "user_roles": ["ADMIN", "MANAGER", "MEMBER", "VIEWER"],
            "user_statuses": ["ACTIVE", "INACTIVE", "AWAY", "SUSPENDED"],
            "issue_priorities": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            "issue_statuses": ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
        },
    }

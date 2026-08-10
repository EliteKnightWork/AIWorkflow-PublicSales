from fastapi import APIRouter

from api.v1.routes import health, chat

# Create main API v1 router
api_router = APIRouter(prefix="/api/v1")

# Include route modules
api_router.include_router(health.router)
api_router.include_router(chat.router)


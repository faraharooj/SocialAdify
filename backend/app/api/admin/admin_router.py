# D:\socialadify\backend\app\api\admin\admin_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path # Import Path for path parameters
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated, List, Optional
import logging
from bson import ObjectId

from app.schemas.user import UserPublic, UserInDB, PyObjectId
from app.core.security import get_current_active_admin # Import the new admin dependency
from app.db.session import get_database
from app.crud import admin as admin_crud # Import the new admin CRUD operations

router = APIRouter()
logger = logging.getLogger(__name__)

DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
AdminUserDependency = Annotated[UserInDB, Depends(get_current_active_admin)]

@router.get("/users", response_model=List[UserPublic], summary="Admin: Get all users with pagination and search")
async def get_all_users_for_admin(
    admin_user: AdminUserDependency, # Protect this endpoint with admin dependency
    db: DbDependency,
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of users to return"),
    search: Optional[str] = Query(None, description="Search query for email, first name, or last name")
):
    """
    Allows administrators to retrieve a list of all user profiles,
    with options for pagination and searching by email, first name, or last name.
    """
    logger.info(f"Admin user {admin_user.email} requesting all users.")
    users_in_db = await admin_crud.get_all_users(db, skip=skip, limit=limit, search_query=search)
    return [UserPublic.from_user_in_db(user) for user in users_in_db]

@router.get("/users/count", response_model=int, summary="Admin: Get total count of users")
async def get_users_total_count(
    admin_user: AdminUserDependency,
    db: DbDependency,
    search: Optional[str] = Query(None, description="Search query for email, first name, or last name")
):
    """
    Returns the total number of user accounts, optionally filtered by a search query.
    """
    logger.info(f"Admin user {admin_user.email} requesting total user count.")
    count = await admin_crud.get_users_count(db, search_query=search)
    return count

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Admin: Delete a user by ID")
async def delete_user_by_id_admin(
    user_id: Annotated[str, Path(description="The ID of the user to delete")], # Use Path for path parameters
    admin_user: AdminUserDependency, # Protect this endpoint with admin dependency
    db: DbDependency
):
    """
    Allows administrators to delete a specific user account by their ID.
    """
    logger.info(f"Admin user {admin_user.email} attempting to delete user ID: {user_id}")
    try:
        user_object_id = PyObjectId(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format.")

    success = await admin_crud.delete_user_by_id(db, user_object_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or could not be deleted.")
    logger.info(f"Admin user {admin_user.email} successfully deleted user ID: {user_id}")
    # For 204 No Content, FastAPI automatically handles the response body.
    # No explicit return value is needed for 204.

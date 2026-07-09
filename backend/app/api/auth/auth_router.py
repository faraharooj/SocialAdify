# D:/socialadify/backend/app/api/auth/auth_router.py

from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated, Optional
import logging
import shutil
from pathlib import Path
import time
import os
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas.user import (
    UserCreate, UserPublic, Token, UserInDB, UserUpdate, 
    PasswordResetRequest, PasswordResetConfirm,
    # --- NEW: Import the model for the change password endpoint ---
    PasswordChange, DeleteAccountRequest
)
from app.crud import user as user_service
from app.core.email_utils import send_password_reset_email
from app.core.security import create_access_token, get_current_active_user, create_password_reset_token, verify_password_reset_token
from app.db.session import get_database

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent.parent
PROFILE_PICS_DIR = _BACKEND_ROOT / "static" / "profile_pics"

router = APIRouter()
logger = logging.getLogger(__name__)
DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]


# --- (Core auth endpoints remain unchanged) ---
@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def signup_user(user_in: UserCreate, db: DbDependency):
    existing_user = await user_service.get_user_by_email(db, email=user_in.email.lower())
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    created_user = await user_service.create_user(db=db, user_create=user_in)
    return UserPublic.from_user_in_db(created_user)


@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbDependency):
    user = await user_service.authenticate_user(db=db, email=form_data.username.lower(), password=form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=UserPublic)
async def read_users_me(current_user: CurrentUserDependency):
    return UserPublic.from_user_in_db(current_user)


# --- NEW: The Missing Change Password Endpoint ---
@router.post("/users/me/change-password")
async def change_current_user_password(
    password_data: PasswordChange,
    current_user: CurrentUserDependency,
    db: DbDependency
):
    """
    Allows an authenticated user to change their own password.
    """
    # 1. Authenticate the user with their current password
    user = await user_service.authenticate_user(db, email=current_user.email, password=password_data.current_password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")

    # 2. If authentication is successful, update to the new password
    success = await user_service.update_user_password(db, user=current_user, new_password=password_data.new_password)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update password.")
    
    return {"message": "Password updated successfully"}


@router.post("/forgot-password")
async def request_password_reset_endpoint(
    request: PasswordResetRequest, 
    db: DbDependency
):
    """
    Initiates the password reset process for a user.
    """
    user = await user_service.get_user_by_email(db, email=request.email.lower())
    if user:
        password_reset_token = create_password_reset_token(email=user.email)
        await send_password_reset_email(
            email_to=user.email,
            username=user.firstname,
            token=password_reset_token
        )
    else:
        logger.info(f"Password reset requested for non-existent email: {request.email}")

    return {"message": "If an account with this email exists, a password reset link will be sent to your terminal."}


@router.post("/reset-password")
async def reset_password_endpoint(
    request: PasswordResetConfirm,
    db: DbDependency
):
    """
    Resets the user's password using a valid token.
    """
    email = verify_password_reset_token(token=request.token)
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired password reset token.")

    user = await user_service.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    success = await user_service.update_user_password(db, user=user, new_password=request.new_password)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update password in the database.")
    
    return {"message": "Your password has been reset successfully."}


# --- (Profile management endpoints remain unchanged) ---
@router.put("/users/me/profile", response_model=UserPublic)
async def update_current_user_profile_text_and_email(
    current_user: CurrentUserDependency,
    db: DbDependency,
    firstname: Optional[str] = Form(None),
    lastname: Optional[str] = Form(None),
    new_email: Optional[str] = Form(None)
):
    update_data_dict = {k: v for k, v in {"firstname": firstname, "lastname": lastname, "new_email": new_email}.items() if v is not None}
    if not update_data_dict:
        return UserPublic.from_user_in_db(current_user)
    try:
        user_update_schema = UserUpdate(**update_data_dict)
        updated_user_db = await user_service.update_user_profile(db=db, user_id=current_user.id, user_update_data=user_update_schema)
        if not updated_user_db:
            raise HTTPException(status_code=500, detail="Could not update profile information.")
        return UserPublic.from_user_in_db(updated_user_db)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error updating profile for user {current_user.email}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update profile.")


@router.post("/users/me/profile-picture", response_model=UserPublic)
async def upload_profile_picture(
    current_user: CurrentUserDependency,
    db: DbDependency,
    profile_picture: UploadFile = File(...)
):
    if not profile_picture.content_type or not profile_picture.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")
    PROFILE_PICS_DIR.mkdir(parents=True, exist_ok=True)
    file_extension = Path(profile_picture.filename).suffix.lower() if profile_picture.filename else ".jpg"
    timestamp = int(time.time())
    unique_filename = f"{str(current_user.id)}_{timestamp}{file_extension}"
    file_path = PROFILE_PICS_DIR / unique_filename
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(profile_picture.file, buffer)
    finally:
        profile_picture.file.close()
    profile_picture_url_path = f"/static/profile_pics/{unique_filename}"
    updated_user_db = await user_service.update_user_profile(
        db=db, 
        user_id=current_user.id, 
        user_update_data=UserUpdate(),
        profile_picture_url=profile_picture_url_path
    )
    if not updated_user_db:
        if file_path.exists():
            try: os.remove(file_path)
            except Exception: pass
        raise HTTPException(status_code=500, detail="Could not update profile picture information.")
    return UserPublic.from_user_in_db(updated_user_db)

# --- NEW: The Missing Delete Account Endpoint ---
@router.post("/users/me/delete-account")
async def delete_current_user_account(
    delete_data: DeleteAccountRequest,
    current_user: CurrentUserDependency,
    db: DbDependency
):
    """
    Allows an authenticated user to permanently delete their own account.
    """
    # The delete_user function in crud/user.py handles password verification
    success = await user_service.delete_user(
        db, 
        user=current_user, 
        current_password_to_verify=delete_data.password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password. Account not deleted."
        )
    
    return {"message": "Account deleted successfully."}
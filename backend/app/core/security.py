# D:\socialadify\backend\app\core\security.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated
import secrets

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Imports configuration variables
from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.session import get_database
from app.crud import user as user_crud
from app.schemas.user import UserInDB, UserPublic

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# OAuth2 scheme for token dependency
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# JWT Token Creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    current_time_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = current_time_utc + expires_delta
    else:
        expire = current_time_utc + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": current_time_utc})

    if not SECRET_KEY or not ALGORITHM:
        raise ValueError("JWT settings (SECRET_KEY, ALGORITHM) are not configured.")

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- NEW/UPDATED FUNCTIONS FOR PASSWORD RESET ---

def create_password_reset_token(email: str) -> str:
    """
    Generates a secure, time-sensitive JWT for password resets.
    The token will be valid for 1 hour.
    """
    expires_delta = timedelta(hours=1)
    expire = datetime.now(timezone.utc) + expires_delta
    
    to_encode = {
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "sub": email,
        "scope": "password_reset" # Add a scope to distinguish from regular access tokens
    }
    
    if not SECRET_KEY or not ALGORITHM:
        raise ValueError("JWT settings (SECRET_KEY, ALGORITHM) are not configured.")
        
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verifies a password reset token.
    Returns the user's email if the token is valid, not expired, and has the correct scope.
    Returns None otherwise.
    """
    try:
        if not SECRET_KEY or not ALGORITHM:
            raise ValueError("JWT settings are not configured.")
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Security check: ensure this token is specifically for password reset
        if payload.get("scope") != "password_reset":
            return None
            
        email: str = payload.get("sub")
        if email is None:
            return None
        
        # The 'exp' (expiration) check is automatically handled by jwt.decode()
        return email
        
    except JWTError:
        # This catches invalid format, expired tokens, or tampered signatures
        return None

# --- (Existing functions for getting current user remain unchanged) ---

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodes an access token.
    Returns the payload if valid, None otherwise.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        print(f"JWTError decoding token: {e}")
        return None

DbDependency = Annotated[AsyncIOMotorDatabase, Depends(get_database)]

async def get_current_active_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DbDependency
) -> UserInDB:
    """
    FastAPI dependency to get the current authenticated and active user from a token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        print("get_current_active_user: Token decoding failed or token invalid.")
        raise credentials_exception

    email: Optional[str] = payload.get("sub")
    if email is None:
        print("get_current_active_user: Email (sub) not found in token payload.")
        raise credentials_exception

    user_in_db = await user_crud.get_user_by_email(db, email=email)

    if user_in_db is None:
        print(f"get_current_active_user: User with email {email} not found in DB.")
        raise credentials_exception

    print(f"get_current_active_user: User {user_in_db.email} authenticated successfully.")
    return user_in_db

async def get_current_active_admin(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
) -> UserInDB:
    """
    FastAPI dependency to ensure the current authenticated user is an administrator.
    """
    if not current_user.is_admin:
        print(f"Access denied for user {current_user.email}: Not an admin.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden: Not enough privileges (admin required)"
        )
    print(f"get_current_active_admin: Admin user {current_user.email} authenticated successfully.")
    return current_user


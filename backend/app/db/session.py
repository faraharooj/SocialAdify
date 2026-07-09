# D:/socialadify/backend/app/db/session.py

import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv
import certifi
from pathlib import Path
import logging
from contextlib import asynccontextmanager # --- NEW IMPORT ---

logger = logging.getLogger(__name__)

# Construct path to .env in the backend root directory
backend_root = Path(__file__).resolve().parent.parent.parent
dotenv_path = backend_root / ".env"

if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
    logger.info(f"Loaded .env file from: {dotenv_path}")
else:
    logger.warning(f"WARNING: .env file not found at {dotenv_path} by session.py. Relying on system environment variables or .env loaded elsewhere.")

# --- Database Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL")
DB_NAME = os.getenv("MONGODB_DB_NAME", "db_socialadify")

if not DATABASE_URL:
    logger.critical("CRITICAL ERROR: DATABASE_URL not set in environment. Connection will likely fail.")

# --- Global Database Client and Database Instance ---
client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None

async def connect_to_mongo():
    """
    Establishes the connection to MongoDB when the application starts.
    """
    global client, db
    if not DATABASE_URL:
        logger.critical("CRITICAL ERROR: DATABASE_URL is not set. Cannot connect to MongoDB.")
        return

    logger.info(f"Attempting to connect to MongoDB (DB: '{DB_NAME}')")
    
    try:
        ca = certifi.where()
        client = AsyncIOMotorClient(DATABASE_URL, tlsCAFile=ca)
        await client.admin.command('ping')
        db = client[DB_NAME]
        logger.info(f"Successfully connected to MongoDB and obtained database instance for: '{DB_NAME}'")
        
    except Exception as e:
        logger.critical(f"Error connecting to MongoDB: {e}", exc_info=True)
        client = None
        db = None


async def close_mongo_connection():
    """
    Closes the MongoDB connection when the application shuts down.
    """
    global client
    if client:
        logger.info("Closing MongoDB connection...")
        client.close()
        logger.info("MongoDB connection closed.")

async def get_database() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency to get the database instance.
    """
    if db is None:
        logger.error("get_database() called but 'db' instance is None. Connection issue at startup.")
        raise Exception("Database not initialized.")
    return db

# --- NEW FUNCTION TO FIX THE IMPORT ERROR ---
@asynccontextmanager
async def get_database_context():
    """
    Provides a database session within an async context manager.
    This is used by background services that run outside of a typical request cycle.
    """
    if db is None:
        logger.error("get_database_context() called but 'db' instance is None.")
        raise Exception("Database not initialized.")
    try:
        yield db
    finally:
        # The connection is managed by the app's lifespan, so we don't close it here.
        # This context is just for providing the 'db' object.
        pass

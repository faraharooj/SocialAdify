# D:/socialadify/backend/main.py

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.scheduler_service import process_due_posts
from app.db.session import connect_to_mongo, close_mongo_connection
from app.core.config import CLIENT_HOST

# --- CLEANUP: Standardized Router Imports ---
# All routers are now imported using the same clear pattern.
from app.api.auth.auth_router import router as auth_router
from app.api.auth.google_auth_router import router as google_auth_router
# --- NEW: Import your new Meta authentication router ---
from app.api.auth.meta_auth_router import router as meta_auth_router

from app.api.insights.router import router as insights_router
from app.api.insights.meta_router import router as meta_insights_router
from app.api.insights.google_ads_router import router as google_ads_router

from app.api.captions.router import router as captions_router
from app.api.admin.admin_router import router as admin_router
from app.api.scheduling.router import router as scheduling_router
from app.api.post_generator.router import router as post_generator_router
from app.api.history.router import router as history_router
from app.api.templates.router import router as templates_router
from app.api.ads.router import router as ads_router
from app.api.ads.meta_router import router as meta_ads_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- (Static file path setup remains the same) ---
MAIN_PY_DIR = Path(__file__).resolve().parent
STATIC_FILES_DIR = MAIN_PY_DIR / "static"
STATIC_FILES_DIR.mkdir(parents=True, exist_ok=True)


# --- (Lifespan function for startup/shutdown remains the same) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup: Initializing resources...")
    await connect_to_mongo()
    
    logger.info("Starting background scheduler...")
    scheduler = AsyncIOScheduler()
    scheduler.add_job(process_due_posts, 'interval', minutes=1)
    scheduler.start()
    logger.info("Background scheduler started, running every minute.")
    
    yield
    
    logger.info("Application shutdown: Cleaning up resources...")
    scheduler.shutdown()
    await close_mongo_connection()

app = FastAPI(
    title="SocialAdify API",
    description="API for Social Media Ad Management and AI Content Generation Platform",
    version="1.0.0",
    lifespan=lifespan
)

# --- (Static file mounting and CORS middleware remain the same) ---
app.mount("/static", StaticFiles(directory=str(STATIC_FILES_DIR.resolve())), name="static")

if CLIENT_HOST:
    origins = [CLIENT_HOST, "http://localhost:3000", "http://127.0.0.1:3000","https://preearthquake-preactively-gilberte.ngrok-free.dev"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(set(origins)),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# --- API Routers ---
# All routers are now included in a more organized and consistent way.
app.include_router(auth_router, prefix="/auth", tags=["Core Authentication"])
app.include_router(google_auth_router, prefix="/auth", tags=["Google Authentication"])
# --- NEW: Include your new Meta authentication router under the /auth prefix ---
app.include_router(meta_auth_router, prefix="/auth", tags=["Meta Authentication"])

app.include_router(insights_router, prefix="/insights", tags=["Insights & Ad Analytics"])
app.include_router(meta_insights_router, prefix="/insights", tags=["Meta Insights"]) 
app.include_router(google_ads_router, prefix="/insights", tags=["Google Ads Insights"])

app.include_router(captions_router, prefix="/captions", tags=["AI Caption Generation"])
app.include_router(scheduling_router, prefix="/scheduler", tags=["Post Scheduling"])
app.include_router(post_generator_router, prefix="/post-generator", tags=["Post Generator"])
app.include_router(history_router, prefix="/history", tags=["History"])
app.include_router(admin_router, prefix="/admin", tags=["Admin Panel"])
app.include_router(templates_router, prefix="/templates", tags=["Post Templates"])
app.include_router(ads_router, prefix="/ads", tags=["AI Ad Creation"])
app.include_router(meta_ads_router, prefix="/ads/meta", tags=["Meta Ad Creation"])


# --- (Root and health check endpoints remain the same) ---
@app.get("/")
async def read_root():
    return {"message": "Welcome to the SocialAdify Backend API!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
# D:\socialadify\backend\app\api\insights\router.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Union, Annotated
import logging # --- ADDED

# --- Auth Imports (ADDED) ---
from app.core.security import get_current_active_user
from app.schemas.user import UserInDB
# ---

# --- ML/Data Handling Imports ---
import joblib
from pathlib import Path
import pandas as pd
import random

# --- Import all 3 mock data structures ---
from .mock_data import (
    MOCK_CAMPAIGN_PERFORMANCE_1, 
    MOCK_CAMPAIGN_PERFORMANCE_2,
    MOCK_CAMPAIGN_PERFORMANCE_3
)

router = APIRouter()
logger = logging.getLogger(__name__) # --- ADDED

# --- Auth Dependency (ADDED) ---
CurrentUserDependency = Annotated[UserInDB, Depends(get_current_active_user)]
# ---

# --- Dictionary to hold all mock campaigns for easy lookup ---
ALL_MOCK_CAMPAIGNS = {
    MOCK_CAMPAIGN_PERFORMANCE_1["campaign_id"]: MOCK_CAMPAIGN_PERFORMANCE_1,
    MOCK_CAMPAIGN_PERFORMANCE_2["campaign_id"]: MOCK_CAMPAIGN_PERFORMANCE_2,
    MOCK_CAMPAIGN_PERFORMANCE_3["campaign_id"]: MOCK_CAMPAIGN_PERFORMANCE_3,
}

# --- ML Model Loading Section (Unchanged) ---
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "ml_models"

preprocessor = None
suggestion_model = None
label_encoder = None
models_loaded_successfully = False

try:
    print(f"Attempting to load models from: {MODEL_DIR}")
    preprocessor = joblib.load(MODEL_DIR / "preprocessor.joblib")
    suggestion_model = joblib.load(MODEL_DIR / "xgb_suggestion_classifier.joblib")
    label_encoder = joblib.load(MODEL_DIR / "suggestion_label_encoder.joblib")
    models_loaded_successfully = True
    print("ML models (preprocessor, XGBoost classifier, label encoder) loaded successfully.")
except Exception as e:
    print(f"An unexpected error occurred during ML model loading: {e}")
finally:
    if not models_loaded_successfully:
        print("One or more ML models failed to load. AI Suggestion functionality will be affected.")


# --- Pydantic Schemas for AI Suggestion ---
class AdSuggestionResponse(BaseModel):
    ad_id: str
    suggestion: str

# --- NEW: Endpoint for Dashboard Overview ---
@router.get("/overview", summary="Get aggregated dashboard metrics")
async def get_dashboard_overview(current_user: CurrentUserDependency):
    """
    Aggregates performance data from all mock campaigns (Google & Meta).
    """
    logger.info(f"Calculating dashboard overview for user: {current_user.email}")

    all_campaigns = [
        MOCK_CAMPAIGN_PERFORMANCE_1,
        MOCK_CAMPAIGN_PERFORMANCE_2,
        MOCK_CAMPAIGN_PERFORMANCE_3
    ]

    total_impressions = 0
    total_clicks = 0
    total_cost_micros = 0

    for campaign in all_campaigns:
        perf_data = campaign.get('performance_data', [])
        total_impressions += sum(day['impressions'] for day in perf_data)
        total_clicks += sum(day['clicks'] for day in perf_data)
        total_cost_micros += sum(day['cost_micros'] for day in perf_data)

    # Convert micros to currency unit for display
    total_cost = total_cost_micros / 1_000_000

    # Helper for formatting (K/M)
    def format_number(num):
        if num >= 1_000_000:
            return f"{num/1_000_000:.1f}M"
        if num >= 1_000:
            return f"{num/1_000:.1f}K"
        return str(int(num))

    # --- UPDATED RETURN STRUCTURE ---
    return {
        "impressions": {
            "value": format_number(total_impressions),
            "raw": total_impressions,
            "trend": 12, 
            "status": "up" 
        },
        "cost_micros": { # Keeping the key you requested, but value is formatted currency
            "value": f"${format_number(total_cost)}", 
            "raw": total_cost,
            "trend": -5, 
            "status": "down"
        },
        "clicks": {
            "value": format_number(total_clicks),
            "raw": total_clicks,
            "trend": 8, 
            "status": "up"
        }
    }

# --- AI SUGGESTION ENDPOINT ---
@router.post("/campaign/{campaign_id}/generate-suggestion", response_model=AdSuggestionResponse, summary="Generate AI-based suggestion for a campaign")
async def generate_campaign_suggestion(campaign_id: str):
    # ... (Rest of the function remains exactly the same as before) ...
    if not models_loaded_successfully:
        raise HTTPException(status_code=503, detail="AI Suggestion service is unavailable: Models not loaded.")

    target_campaign_data = ALL_MOCK_CAMPAIGNS.get(campaign_id)

    if not target_campaign_data:
        raise HTTPException(
            status_code=404,
            detail=f"Detailed Metrics Unavailable for this Ad Account or Campaign!"
        )

    try:
        perf_data = target_campaign_data["performance_data"]
        total_clicks = sum(day['clicks'] for day in perf_data)
        total_impressions = sum(day['impressions'] for day in perf_data)
        total_cost_micros = sum(day['cost_micros'] for day in perf_data)

        spend = total_cost_micros / 1000000
        
        if campaign_id == MOCK_CAMPAIGN_PERFORMANCE_1["campaign_id"]:
            revenue_multiplier = 1.8
        elif campaign_id == MOCK_CAMPAIGN_PERFORMANCE_3["campaign_id"]:
            revenue_multiplier = 1.5
        else:
            revenue_multiplier = 1.2
            
        revenue = spend * revenue_multiplier
        roi = ((revenue - spend) / spend) if spend > 0 else 0
        conversion_rate = (total_clicks / total_impressions) * 100 if total_impressions > 0 else 0

        features_for_model_dict = {
            "Target_Audience": "Young_Professionals",
            "Conversion_Rate": conversion_rate,
            "Spend": spend,
            "ROI": roi,
            "Clicks": total_clicks,
            "Impressions": total_impressions,
            "Engagement_Score": random.uniform(0.05, 0.15),
            "Ad_Type": "Video_Ad",
        }

        model_feature_order = [
            "Target_Audience", "Conversion_Rate", "Spend", "ROI",
            "Clicks", "Impressions", "Engagement_Score", "Ad_Type"
        ]
        features_df = pd.DataFrame([features_for_model_dict], columns=model_feature_order)

    except Exception as e:
        print(f"Error preparing features for mock campaign '{campaign_id}': {e}")
        raise HTTPException(status_code=500, detail=f"Error preparing data for AI model: {str(e)}")

    try:
        processed_features = preprocessor.transform(features_df)
        prediction_encoded = suggestion_model.predict(processed_features)
        suggestion_text_array = label_encoder.inverse_transform(prediction_encoded)
        final_suggestion = suggestion_text_array[0]
    except Exception as e:
        print(f"Error during AI model prediction pipeline: {e}")
        raise HTTPException(status_code=500, detail=f"AI model prediction error: {str(e)}")

    return AdSuggestionResponse(
        ad_id=campaign_id,
        suggestion=str(final_suggestion)
    )
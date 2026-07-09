# D:/socialadify/backend/app/services/gemini_service.py

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any # <-- ADDED 'Any'
import warnings
import re
from pytz import timezone
import logging
import os
import joblib
import google.generativeai as genai
import json
import sys
# --- NEW IMPORTS ---
from google.generativeai.types import GenerationConfig

warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning("GOOGLE_API_KEY not found in environment variables. Gemini API fallback will not work.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# --- Recommender Model Class Definition ---
# This class MUST be defined in this file so that joblib can correctly
# load the saved model object from the .joblib file.
class TimeSlotRecommender:
    def __init__(self):
        self.platform_insights = {}
        self.is_trained = False

    def get_content_category(self, text: str) -> str:
        if pd.isna(text):
            return "General"
        text = str(text).lower()
        if 'news' in text or 'breaking' in text or 'update' in text:
            return "News"
        if 'promo' in text or 'sale' in text or 'offer' in text or 'discount' in text:
            return "Promotion"
        if 'tutorial' in text or 'how to' in text or 'guide' in text:
            return "Tutorial"
        if 'behind the scenes' in text or 'day in the life' in text or 'personal' in text:
            return "Personal"
        if 'q&a' in text or 'question' in text or 'poll' in text:
            return "Engagement"
        return "General"

    def get_recommendations(self, platform: str, content_category: str = 'General', user_timezone: str = 'UTC') -> List[Dict]:
        if not self.is_trained:
            raise Exception("Model not trained!")
        if platform not in self.platform_insights:
            return []
        
        valid_categories = ['General', 'News', 'Promotion', 'Tutorial', 'Personal', 'Engagement']
        if content_category not in valid_categories:
            content_category = 'General'

        insights = self.platform_insights[platform]
        time_data = insights['time_analysis']
        
        filtered_data = time_data[time_data['ContentCategory'] == content_category]

        count_col = next((c for c in filtered_data.columns if c.endswith('_count')), None)
        mean_col = next((c for c in filtered_data.columns if c.endswith('_mean')), None)

        if count_col is None or mean_col is None:
            return []

        reliable_times = filtered_data[filtered_data[count_col] >= 5]
        if reliable_times.empty:
            reliable_times = filtered_data # Fallback to less reliable data if needed
        
        top_slots = reliable_times.sort_values(mean_col, ascending=False).head(5)

        recommendations = []
        for _, row in top_slots.iterrows():
            hour = int(row['Hour']) if not pd.isna(row['Hour']) else None
            if hour is not None:
                recommendations.append({
                    'Hour': hour,
                    'DayOfWeek': row['DayOfWeek'],
                    'Predicted Engagement': float(row[mean_col]),
                    'ContentCategory': row['ContentCategory']
                })
        return recommendations


# --- Model Loading Logic (Runs once on application startup) ---
recommender = None
MODEL_LOADED = False
# The model file should be in the same directory as this service file.
MODEL_FILE_PATH = os.path.join(os.path.dirname(__file__), "recommender_model.joblib")

def load_recommender_model():
    global recommender, MODEL_LOADED
    if not MODEL_LOADED:
        try:
            logger.info(f"Attempting to load recommender model from: {MODEL_FILE_PATH}")
            with open(MODEL_FILE_PATH, 'rb') as f:
                # This trick helps joblib find the class definition within this module
                sys.modules['__main__'] = sys.modules[__name__]
                recommender = joblib.load(f)
            MODEL_LOADED = True
            logger.info("Custom recommender model loaded successfully.")
        except FileNotFoundError:
            logger.error(f"MODEL NOT FOUND at '{MODEL_FILE_PATH}'. The recommender will not be available.")
            MODEL_LOADED = False
        except Exception as e:
            logger.error(f"An error occurred while loading the model: {e}", exc_info=True)
            MODEL_LOADED = False

load_recommender_model()


# --- Gemini Fallback Service ---
async def get_gemini_fallback_recommendation(caption: str, platform: str) -> Dict:
    if not GEMINI_API_KEY:
        raise Exception("Gemini API key is not configured for fallback.")

    model = genai.GenerativeModel('gemini-2.0-flash') # This is what you had, so I'm keeping it
    prompt = (
        f"You are a social media expert for the Pakistani market. Based on the caption \"{caption}\", "
        f"suggest the best day and time to post on {platform}. "
        f"The current date is {datetime.now().strftime('%Y-%m-%d')}. The suggestion should be a future date within the next 7 days. "
        f"Return ONLY a JSON object with 'suggested_time_utc' (YYYY-MM-DDTHH:MM:SS) and 'reasoning'."
    )
    try:
        response = await model.generate_content_async(prompt)
        response_text = response.text.strip()
        json_match = response_text[response_text.find('{'):response_text.rfind('}')+1]
        suggestion_data = json.loads(json_match)
        if 'suggested_time_utc' not in suggestion_data or 'reasoning' not in suggestion_data:
            raise ValueError("AI response did not contain the required JSON keys.")
        return suggestion_data
    except Exception as e:
        logger.error(f"Error in Gemini fallback: {e}", exc_info=True)
        fallback_time = datetime.now() + timedelta(days=1, hours=3)
        return {
            "suggested_time_utc": fallback_time.strftime('%Y-%m-%dT%H:%M:%S'),
            "reasoning": "AI fallback failed."
        }


# --- Main Public Function (replaces the old get_optimal_post_time) ---
async def get_optimal_post_time(caption: str, platform: str, is_boosted: bool, user_timezone: str = 'Asia/Karachi') -> Dict:
    """
    Gets the optimal post time, prioritizing the custom model and using Gemini as a fallback.
    The 'is_boosted' parameter is kept for compatibility but not used by the custom model.
    """
    if MODEL_LOADED and platform in ["Facebook", "Instagram"]:
        logger.info(f"Using custom model for {platform} recommendation.")
        content_category = recommender.get_content_category(caption)
        recommendations = recommender.get_recommendations(platform, content_category, user_timezone)

        if not recommendations:
            logger.info("No specific recommendation found, trying 'General' category.")
            recommendations = recommender.get_recommendations(platform, 'General', user_timezone)
        
        if recommendations:
            top_rec = recommendations[0]
            
            # Logic to determine the next upcoming date for the recommended day/time
            now = datetime.now(timezone(user_timezone))
            suggested_time = now
            
            if top_rec['DayOfWeek'] == 'Weekday':
                # Find the next weekday
                if now.weekday() >= 4: # If it's Friday, Saturday, or Sunday
                    days_to_add = (7 - now.weekday()) % 7 # Days until next Monday
                    if days_to_add == 0: days_to_add = 1 # Handle Sunday case
                else:
                    days_to_add = 1 # Just suggest the next day
            elif top_rec['DayOfWeek'] == 'Weekend':
                # Find the next weekend day
                if now.weekday() < 5: # If it's a weekday
                    days_to_add = 5 - now.weekday() # Days until Saturday
                else:
                    days_to_add = 1 # It's Saturday, suggest Sunday
            else: # Specific day like 'Monday'
                days_map = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
                rec_day_index = days_map.get(top_rec['DayOfWeek'], now.weekday() + 1)
                days_to_add = (rec_day_index - now.weekday() + 7) % 7
                if days_to_add == 0: days_to_add = 7 # If it's the same day, suggest next week
                
            suggested_time += timedelta(days=days_to_add)
            suggested_time = suggested_time.replace(hour=top_rec['Hour'], minute=0, second=0, microsecond=0)
            
            # Convert to UTC for the final response
            suggested_time_utc = suggested_time.astimezone(timezone('UTC'))

            reasoning = (
                f"Model suggests posting on a {top_rec['DayOfWeek']} around {top_rec['Hour']}:00 for '{top_rec['ContentCategory']}' content to maximize engagement."
            )

            return {
                "suggested_time_utc": suggested_time_utc.strftime('%Y-%m-%dT%H:%M:%S'),
                "reasoning": reasoning
            }

    # Fallback for platforms other than FB/Insta, or if the model failed to load
    logger.info(f"Falling back to Gemini API for {platform} recommendation.")
    try:
        gemini_response = await get_gemini_fallback_recommendation(caption, platform)
        return {
            "suggested_time_utc": gemini_response['suggested_time_utc'],
            "reasoning": f"AI Suggestion: {gemini_response['reasoning']}"
        }
    except Exception as e:
        logger.error(f"Gemini fallback also failed: {e}")
        fallback_time = datetime.now() + timedelta(days=1, hours=2)
        return {
            "suggested_time_utc": fallback_time.strftime('%Y-%m-%dT%H:%M:%S'),
            "reasoning": "AI models unavailable. This is a default fallback time."
        }

# --- NEW FUNCTION FOR AD PLATFORM RECOMMENDATION ---

async def get_platform_recommendation(
    ad_goal: str, 
    audience_description: str, 
    product_description: str
) -> Dict[str, Any]:
    """
    Uses Gemini to recommend the best ad platform (Google vs. Meta)
    based on the user's goals and audience.
    """
    if not GEMINI_API_KEY:
        logger.error("Gemini API key is not configured. Cannot get platform recommendation.")
        # Provide a safe fallback response
        return {
            "recommended_platform": "GOOGLE",
            "recommendation": "Google Ads is a powerful platform for capturing user intent and driving traffic. It's a solid choice for most campaigns."
        }
        
    logger.info(f"Generating ad platform recommendation for goal: {ad_goal}")
    
    # Using 1.5-flash-latest as it's modern and supports JSON mode well
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
    As a digital marketing expert, I need to choose the best advertising platform for my new campaign.
    Please recommend either "Google Ads" or "Meta (Facebook/Instagram)" and provide a justification.
    
    My Campaign Details:
    - Product/Service: {product_description}
    - Marketing Goal: {ad_goal}
    - Target Audience: {audience_description}

    First, analyze the information. 
    - Google Ads is best for high-intent searches (e.g., "buy wireless headphones").
    - Meta is best for discovery and audience-based targeting (e.g., showing ads to people interested in gaming).

    Based on this, which platform is the single best choice?
    
    Your response must be in JSON format with exactly these two keys:
    1. "recommended_platform": A single string, either "GOOGLE" or "META".
    2. "recommendation": A 2-3 sentence justification for your choice, explaining *why* it's better for this specific campaign.
    
    Example Response:
    {{
      "recommended_platform": "META",
      "recommendation": "For a 'brand awareness' goal targeting 'gamers', Meta is superior. You can directly target users with this interest, showing them your product even when they aren't actively searching for it, which is perfect for building brand discovery."
    }}
    """
    
    try:
        # We need to ensure Gemini *only* responds with JSON
        generation_config = GenerationConfig(response_mime_type="application/json")
        
        response = await model.generate_content_async(
            prompt,
            generation_config=generation_config
        )
        
        # Parse the JSON response from Gemini
        response_json = json.loads(response.text)
        
        # Validate the response keys
        if "recommended_platform" not in response_json or "recommendation" not in response_json:
            raise Exception("AI response was missing required keys.")
            
        # Ensure platform is one of the allowed values
        if response_json["recommended_platform"] not in ["GOOGLE", "META"]:
            logger.warning("AI recommended an invalid platform, defaulting to GOOGLE.")
            response_json["recommended_platform"] = "GOOGLE"

        return response_json

    except Exception as e:
        logger.error(f"Error calling Gemini for platform recommendation: {e}", exc_info=True)
        # Provide a safe fallback response
        return {
            "recommended_platform": "GOOGLE",
            "recommendation": "Google Ads is a powerful platform for capturing user intent and driving traffic. It's a solid choice for most campaigns."
        }


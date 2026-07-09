# D:/socialadify/backend/check_gemini_models.py

import os
import google.generativeai as genai
from dotenv import load_dotenv

print("--- Checking available Gemini Models ---")

# Load environment variables from .env file
load_dotenv()

# 1. Get the API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("\nERROR: GEMINI_API_KEY not found in your .env file!")
    print("Please make sure your backend/.env file contains the key.")
else:
    print("\nAPI Key found. Configuring...")
    try:
        # 2. Configure the library
        genai.configure(api_key=GEMINI_API_KEY)

        # 3. List the models
        print("\nFetching models available to your API key...")
        print("-" * 30)
        
        found_models = False
        for m in genai.list_models():
            # We only care about models that support the 'generateContent' method
            if 'generateContent' in m.supported_generation_methods:
                print(f"Model Name: {m.name}")
                found_models = True
        
        if not found_models:
             print("No models supporting 'generateContent' were found for your API key.")
        
        print("-" * 30)
        print("\nCheck complete.")

    except Exception as e:
        print(f"\nAn error occurred: {e}")
        print("This could be due to an invalid API key or network issues.")
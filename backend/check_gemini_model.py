import os
import google.generativeai as genai
from dotenv import load_dotenv

print("--- Checking available Gemini Models ---")

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("\nERROR: GEMINI_API_KEY not found in your .env file!")
    print("Please make sure your backend/.env file contains the key.")
else:
    print("\nAPI Key found. Configuring...")
    try:
       
        genai.configure(api_key=GEMINI_API_KEY)

       
        print("\nFetching models available to your API key...")
        print("-" * 30)
        
        found_models = False
        for m in genai.list_models():
            
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

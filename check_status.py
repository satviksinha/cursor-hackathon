#!/usr/bin/env python3
"""
Status checking script for Neural Marionette training process.
This script helps you check the status of your training process after upload.
"""

import requests
import json
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000")

def check_model_availability():
    """Check which models are available for fine-tuning"""
    try:
        response = requests.get(f"{API_URL}/api/models/fine-tuning")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n🤖 Fine-tuning Model Availability")
            print("=" * 40)
            print(f"Current Model: {data.get('current_model', 'unknown')}")
            print(f"Supports Fine-tuning: {'✅' if data.get('model_supports_fine_tuning') else '❌'}")
            print(f"Available Models: {', '.join(data.get('available_models', []))}")
            return data.get('model_supports_fine_tuning', False)
        else:
            print(f"❌ Error checking models: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to API at {API_URL}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_user_status(user_id):
    """Check comprehensive user and training status"""
    try:
        response = requests.get(f"{API_URL}/api/user/{user_id}/status")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n📊 Status Report for User: {user_id}")
            print("=" * 50)
            
            # User status
            print(f"👤 User Status: {data.get('user_status', 'unknown')}")
            print(f"📅 Created: {data.get('created_at', 'unknown')}")
            print(f"🔄 Updated: {data.get('updated_at', 'unknown')}")
            print(f"🤖 Model ID: {data.get('model_id', 'none')}")
            
            # Training data status
            print(f"\n📁 Training Data:")
            print(f"  📝 Text Data: {'✅' if data.get('has_training_data') else '❌'}")
            print(f"  📸 Photo: {'✅' if data.get('has_photo') else '❌'}")
            print(f"  🎤 Voice: {'✅' if data.get('has_voice') else '❌'}")
            
            # Training job status
            if data.get('training_job_id'):
                print(f"\n🚀 Training Job:")
                print(f"  🆔 Job ID: {data.get('training_job_id')}")
                print(f"  🔗 OpenAI Job ID: {data.get('openai_job_id')}")
                print(f"  📊 Status: {data.get('training_status', 'unknown')}")
                print(f"  📈 Progress: {data.get('training_progress', 0)}%")
                print(f"  🎵 Voice ID: {data.get('voice_id', 'none')}")
                print(f"  🤖 OpenAI Model: {data.get('openai_model', 'none')}")
                print(f"  🔢 Trained Tokens: {data.get('trained_tokens', 'none')}")
                
                if data.get('error'):
                    print(f"  ❌ Error: {data.get('error')}")
            else:
                print(f"\n🚀 Training Job: Not started")
                print(f"  💡 Message: {data.get('message', 'No training job found')}")
            
            # Status interpretation
            training_status = data.get('training_status', 'not_started')
            print(f"\n🎯 Current Status: {training_status}")
            
            if training_status == "succeeded":
                print("🎉 Training completed successfully! Your marionette is ready.")
            elif training_status == "failed":
                print("❌ Training failed. Check the error message above.")
            elif training_status == "running":
                print("⏳ Training is in progress. Please wait...")
            elif training_status == "not_started":
                print("🚀 Training hasn't started yet. You can start it manually.")
            else:
                print(f"ℹ️  Status: {training_status}")
                
        elif response.status_code == 404:
            print(f"❌ User {user_id} not found")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to API at {API_URL}")
        print("Make sure the backend server is running.")
    except Exception as e:
        print(f"❌ Error: {e}")

def start_training(user_id):
    """Start training for a user"""
    try:
        response = requests.post(f"{API_URL}/api/train/{user_id}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Training started successfully!")
            print(f"🆔 Job ID: {data.get('job_id')}")
            print(f"📊 Status: {data.get('status')}")
        elif response.status_code == 400:
            error = response.json()
            print(f"❌ Bad Request: {error.get('detail', 'Unknown error')}")
        elif response.status_code == 404:
            print(f"❌ User {user_id} not found")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to API at {API_URL}")
        print("Make sure the backend server is running.")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python check_status.py <user_id>                    # Check status")
        print("  python check_status.py <user_id> --start          # Start training")
        print("  python check_status.py --models                    # Check model availability")
        print("  python check_status.py <user_id> --help            # Show help")
        return
    
    if "--models" in sys.argv:
        check_model_availability()
        return
    
    user_id = sys.argv[1]
    
    if "--help" in sys.argv:
        print("Neural Marionette Status Checker")
        print("=" * 40)
        print("This script helps you check the status of your training process.")
        print("\nCommands:")
        print("  python check_status.py <user_id>                    # Check status")
        print("  python check_status.py <user_id> --start          # Start training")
        print("  python check_status.py --models                    # Check model availability")
        print("\nExamples:")
        print("  python check_status.py 123e4567-e89b-12d3-a456-426614174000")
        print("  python check_status.py 123e4567-e89b-12d3-a456-426614174000 --start")
        print("  python check_status.py --models")
        return
    
    if "--start" in sys.argv:
        start_training(user_id)
    else:
        check_user_status(user_id)

if __name__ == "__main__":
    main()

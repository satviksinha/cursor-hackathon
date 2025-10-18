#!/usr/bin/env python3
"""
Script to help recover your orphaned fine-tuning job
This script will help you find your job ID and recover it
"""

import requests
import json
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def find_and_recover_job():
    """Find job ID and help with recovery"""
    print("🔍 Finding your OpenAI fine-tuning job...")
    print("=" * 50)
    
    # First, let's try to find recent jobs
    try:
        import openai
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        jobs = client.fine_tuning.jobs.list(limit=5)
        
        print("Recent OpenAI Fine-tuning Jobs:")
        print("-" * 30)
        
        if not jobs.data:
            print("❌ No fine-tuning jobs found.")
            return
        
        for i, job in enumerate(jobs.data):
            created_time = datetime.fromtimestamp(job.created_at)
            status_emoji = {
                "validating_files": "🔍",
                "queued": "⏳", 
                "running": "🏃",
                "succeeded": "✅",
                "failed": "❌",
                "cancelled": "🚫"
            }.get(job.status, "❓")
            
            print(f"\n{i+1}. {status_emoji} {job.id}")
            print(f"   Status: {job.status}")
            print(f"   Created: {created_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"   Model: {job.fine_tuned_model or 'Not ready yet'}")
        
        print("\n" + "=" * 50)
        print("📋 Recovery Instructions:")
        print("1. Copy the job ID from above")
        print("2. Make sure your backend server is running")
        print("3. Use the recovery endpoint:")
        print()
        print("   POST http://localhost:8000/api/train/{your_user_id}/recover?openai_job_id=your_job_id_here")
        print()
        print("   Or use curl:")
        print("   curl -X POST 'http://localhost:8000/api/train/{your_user_id}/recover?openai_job_id=your_job_id_here'")
        
    except ImportError:
        print("❌ OpenAI library not installed. Install with: pip install openai")
    except Exception as e:
        print(f"❌ Error fetching jobs: {e}")
        print("\n💡 You can also find your job ID at:")
        print("   https://platform.openai.com/finetune")

def test_recovery_endpoint(user_id, job_id, base_url="http://localhost:8000"):
    """Test the recovery endpoint"""
    try:
        url = f"{base_url}/api/train/{user_id}/recover"
        params = {"openai_job_id": job_id}
        
        print(f"🔄 Attempting recovery for user {user_id} with job {job_id}...")
        
        response = requests.post(url, params=params, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Recovery successful!")
            print(f"   Status: {result.get('status')}")
            print(f"   OpenAI Status: {result.get('openai_status')}")
            print(f"   User Status: {result.get('user_status')}")
            if result.get('voice_id'):
                print(f"   Voice ID: {result.get('voice_id')}")
            else:
                print("   ⚠️  Voice clone not created (can be retried later)")
        else:
            print(f"❌ Recovery failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend server.")
        print("   Make sure your backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error during recovery: {e}")

if __name__ == "__main__":
    if len(sys.argv) == 3:
        # Test recovery with provided user_id and job_id
        user_id = sys.argv[1]
        job_id = sys.argv[2]
        test_recovery_endpoint(user_id, job_id)
    else:
        # Just show instructions
        find_and_recover_job()
        print("\n💡 To test recovery, run:")
        print("   python recover_job.py <user_id> <job_id>")

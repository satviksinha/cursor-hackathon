#!/usr/bin/env python3
"""
Script to help find your OpenAI fine-tuning job ID
Run this script to list recent fine-tuning jobs from OpenAI
"""

import os
import openai
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

def find_recent_jobs():
    """Find recent fine-tuning jobs"""
    try:
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Get fine-tuning jobs
        jobs = client.fine_tuning.jobs.list(limit=10)
        
        print("Recent OpenAI Fine-tuning Jobs:")
        print("=" * 50)
        
        if not jobs.data:
            print("No fine-tuning jobs found.")
            return
        
        for job in jobs.data:
            created_time = datetime.fromtimestamp(job.created_at)
            status_emoji = {
                "validating_files": "🔍",
                "queued": "⏳", 
                "running": "🏃",
                "succeeded": "✅",
                "failed": "❌",
                "cancelled": "🚫"
            }.get(job.status, "❓")
            
            print(f"\n{status_emoji} Job ID: {job.id}")
            print(f"   Status: {job.status}")
            print(f"   Created: {created_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"   Model: {job.fine_tuned_model or 'Not ready yet'}")
            
            if job.finished_at:
                finished_time = datetime.fromtimestamp(job.finished_at)
                duration = finished_time - created_time
                print(f"   Finished: {finished_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   Duration: {duration}")
            
            if job.trained_tokens:
                print(f"   Tokens trained: {job.trained_tokens}")
                
            if job.error:
                print(f"   Error: {job.error}")
        
        print("\n" + "=" * 50)
        print("To recover a job, use:")
        print("POST /api/train/{user_id}/recover")
        print("Body: {\"openai_job_id\": \"your_job_id_here\"}")
        
    except Exception as e:
        print(f"Error fetching jobs: {e}")
        print("\nMake sure your OPENAI_API_KEY is set in your .env file")

if __name__ == "__main__":
    find_recent_jobs()

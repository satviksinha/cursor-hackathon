#!/bin/bash

# Neural Marionette Deployment Script
# This script sets up the complete Neural Marionette system

set -e

echo "🎭 Neural Marionette - Deployment Script"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check for required tools
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+"
    exit 1
fi

if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed. Please install pip"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Check for environment file
if [ ! -f ".env" ]; then
    echo "⚠️  Environment file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your API keys before continuing"
    echo "   Required keys:"
    echo "   - OPENAI_API_KEY"
    echo "   - ELEVENLABS_API_KEY"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - PRIME_INTELLECT_API_KEY"
    echo ""
    read -p "Press Enter after you've configured your .env file..."
fi

# Validate environment variables
echo "🔐 Validating environment variables..."
source .env

required_vars=("OPENAI_API_KEY" "ELEVENLABS_API_KEY" "SUPABASE_URL" "SUPABASE_ANON_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env file"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p temp

# Set up Supabase (if not already done)
echo "🗄️  Setting up Supabase..."
echo "   Please ensure you have:"
echo "   1. Created a Supabase project"
echo "   2. Run the SQL schema from supabase-schema.sql"
echo "   3. Created a storage bucket named 'training-data'"
echo ""
read -p "Press Enter when Supabase is configured..."

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Test backend health
echo "🏥 Testing backend health..."
cd backend
python -c "
import sys
sys.path.append('.')
try:
    from main import app
    print('✅ Backend imports successful')
except Exception as e:
    print(f'❌ Backend import failed: {e}')
    sys.exit(1)
"
cd ..

echo ""
echo "🎉 Deployment setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   1. Terminal 1: npm run dev (Frontend)"
echo "   2. Terminal 2: npm run backend (Backend API)"
echo "   3. Terminal 3: cd sadtalker-server && python serve.py (SadTalker on Prime Intellect)"
echo ""
echo "🌐 Access points:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - SadTalker Server: http://localhost:8001"
echo ""
echo "📚 Next steps:"
echo "   1. Upload your data (text, photo, voice)"
echo "   2. Wait for fine-tuning to complete"
echo "   3. Chat with your marionette!"
echo ""
echo "🏆 Ready to win that hackathon! 🏆"

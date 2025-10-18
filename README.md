# Personality-Aligned Assistant - Real-Time Personalization

> "Forget generic AI assistants. We've built a system that learns your personality through interactive questionnaires and personalizes every interaction using RAG, mem0, and Exa search."

A hackathon project that uses Big Five personality assessment to create a truly personalized AI assistant that adapts its responses, search preferences, and communication style based on your unique personality profile.

## 🚀 Features

- **Interactive Personality Assessment**: Big Five (OCEAN) questionnaire with 20 scientifically-validated questions
- **Local-First Privacy**: Personality profiles stored locally with mem0 - your data never leaves your device
- **Personalized Responses**: OpenAI GPT-4o-mini responses tailored to your personality traits
- **Smart Search Integration**: Exa.ai search results customized based on your personality preferences
- **Real-Time Adaptation**: Communication style adapts to your Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism
- **Modern UI**: Next.js frontend with beautiful personality visualization and insights

## 🏗️ Architecture

```
User → Personality Assessment → mem0 Storage → Personalized Chat → OpenAI + Exa Search
```

**New Flow:**

1. **Onboarding**: Interactive Big Five questionnaire
2. **Storage**: Personality profile stored locally with mem0 via Smithery gateway
3. **Personalization**: Chat responses adapted based on personality traits
4. **Search**: Exa search queries customized to personality preferences
5. **Voice**: ElevenLabs voice synthesis (optional)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, Async Python
- **AI Services**: OpenAI GPT-4o-mini, ElevenLabs Voice Cloning
- **Memory**: mem0 (local-first personality storage)
- **Search**: Exa.ai (personality-driven search)
- **Database**: Supabase (PostgreSQL + Storage)
- **Real-time**: Native WebSocket communication

## 📋 Prerequisites

- Node.js 18+
- Python 3.9+
- Supabase account
- OpenAI API key
- ElevenLabs API key (optional)
- Exa.ai API key

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd neural-marionette
npm install
cd backend
pip install -r requirements.txt
```

### 2. Environment Setup

Copy `env.example` to `.env` and fill in your API keys:

```bash
cp env.example .env
```

Required environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key (optional)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `EXA_API_KEY`: Your Exa.ai API key

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql`
3. Create a storage bucket named `training-data`

### 4. Start Development Servers

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend API
npm run backend
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## 🎯 Usage

1. **Personality Assessment**: Complete the Big Five questionnaire at `/onboarding/[userId]`
2. **View Profile**: See your personality radar chart and insights
3. **Personalized Chat**: Interact with your AI assistant at `/chat/[userId]`
4. **Adaptive Search**: Get search results tailored to your personality preferences

## 📁 Project Structure

```
neural-marionette/
├── frontend/               # Next.js frontend application
│   ├── app/               # App Router pages
│   │   ├── page.tsx      # Landing page
│   │   ├── onboarding/[userId]/ # Personality assessment
│   │   ├── chat/[userId]/ # Personalized chat interface
│   │   ├── training/[userId]/ # Training status
│   │   └── voice-upload/[userId]/ # Voice upload
│   ├── components/        # Reusable React components
│   │   ├── ui/           # Basic UI components
│   │   ├── chat/         # Chat-specific components
│   │   ├── onboarding/   # Onboarding components
│   │   └── voice-upload/ # Voice upload components
│   ├── lib/              # Utility libraries
│   │   ├── api.ts        # API client
│   │   ├── auth.tsx      # Authentication
│   │   └── supabase.ts   # Database client
│   ├── public/           # Static assets
│   └── README.md         # Frontend documentation
├── backend/              # Python FastAPI backend
│   ├── main.py          # Main API server
│   ├── mem0_client.py   # Direct mem0 integration
│   ├── exa_client.py    # Exa.ai search client
│   ├── personality_assessment.py # Big Five logic
│   ├── elevenlabs_service.py
│   └── supabase_client.py
├── package.json         # Node.js dependencies & scripts
├── deploy.sh           # Deployment script
├── env.example         # Environment variables template
└── supabase-schema.sql # Database schema
```

## 🔧 API Endpoints

### Backend API (`/api/`)

- `GET /personality/questionnaire` - Get Big Five questions
- `POST /personality/assess/{user_id}` - Process questionnaire answers
- `GET /personality/profile/{user_id}` - Get user's personality profile
- `POST /chat/personalized/{user_id}` - Send personalized chat message
- `GET /health` - Health check

## 🎨 Demo Script

1. **The Assessment**: Show interactive Big Five questionnaire
2. **The Profile**: Display personality radar chart and insights
3. **The Personalization**: Ask vague questions and show tailored responses
4. **The Search**: Demonstrate personality-driven search results
5. **The Comparison**: Show how different personalities get different results

## 🏆 Hackathon Tracks

This project qualifies for multiple hackathon tracks:

- **mem0 Track**: Local-first personality storage with privacy-first approach
- **Exa Track**: Personality-driven search customization
- **OpenAI Track**: GPT-4o-mini with personality-aware prompting
- **ElevenLabs Track**: Voice synthesis (optional feature)

## ⚡ Performance Targets

- **Assessment**: Complete Big Five in <2 minutes
- **Personalization**: Responses adapted to personality traits
- **Privacy**: All personality data stored locally with mem0
- **Search**: Results customized based on personality preferences
- **Wow Factor**: Clear demonstration of personality-driven personalization

## 🔒 Privacy Benefits

- **Local-First**: Personality profiles stored on user's device with mem0
- **No Data Harvesting**: No scraping of private information
- **Consensual**: User explicitly provides personality data
- **Transparent**: Clear explanation of how data is used
- **Controllable**: User can retake assessment or delete profile

## 📝 License

MIT License - feel free to use this for your own hackathon projects!

## 🤝 Contributing

This is a hackathon project, but feel free to submit issues or improvements!

---

**Built for hackathons. Built to personalize. Built to respect privacy.**

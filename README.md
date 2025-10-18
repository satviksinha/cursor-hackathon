# Neural Marionette - Real-Time Ego Hijacking

> "Forget AI clones. That's a simulation. We've built a system that performs real-time neural hijacking of a person's likeness using RAG."

A hackathon project that uses RAG (Retrieval-Augmented Generation) to instantly process user data, clones their voice, and creates a photorealistic talking head avatar - all working together in a seamless pipeline to resurrect someone's digital presence.

## 🚀 Features

- **Instant RAG Processing**: OpenAI text-embedding-3-small + Supabase pgvector for instant personality capture
- **Voice Cloning**: ElevenLabs API for indistinguishable voice synthesis
- **Photorealistic Video**: SadTalker for real-time talking head generation
- **Low Latency**: Sub-3-second end-to-end pipeline
- **Modern UI**: Next.js frontend with real-time WebSocket communication

## 🏗️ Architecture

```
User Input → RAG Retrieval → GPT-4o-mini + Context → ElevenLabs Voice → SadTalker Video → Real-Time Display
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, WebSockets, Async Python
- **AI Services**: OpenAI Embeddings + GPT-4o-mini, ElevenLabs Voice Cloning
- **Vector DB**: Supabase with pgvector extension
- **Video**: SadTalker (open-source talking head)
- **Compute**: Prime Intellect GPU instances
- **Database**: Supabase (PostgreSQL + Storage)
- **Real-time**: Socket.IO for WebSocket communication

## 📋 Prerequisites

- Node.js 18+
- Python 3.9+
- Supabase account
- OpenAI API key
- ElevenLabs API key
- Prime Intellect account ($50 credits)

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
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `PRIME_INTELLECT_API_KEY`: Your Prime Intellect API key

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

# Terminal 3: SadTalker Server (on Prime Intellect GPU)
cd sadtalker-server
python serve.py
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- SadTalker Server: http://localhost:8001

## 🎯 Usage

1. **Upload Data**: Provide text data, profile photo, and voice sample
2. **Training**: Wait for fine-tuning to complete (20-60 minutes)
3. **Chat**: Interact with your photorealistic digital twin

## 📁 Project Structure

```
neural-marionette/
├── app/                    # Next.js frontend
│   ├── page.tsx           # Landing page
│   ├── upload/            # Data upload interface
│   ├── training/[userId]/  # Training progress
│   └── chat/[userId]/     # Live chat interface
├── backend/               # FastAPI backend
│   ├── main.py           # Main API server
│   ├── openai_finetuning.py
│   ├── elevenlabs_service.py
│   ├── sadtalker_client.py
│   ├── supabase_client.py
│   └── pipeline.py        # Main orchestration
├── sadtalker-server/      # SadTalker inference server
│   ├── serve.py          # FastAPI wrapper
│   └── inference.py       # Model inference
└── supabase-schema.sql    # Database schema
```

## 🔧 API Endpoints

### Backend API (`/api/`)

- `POST /upload` - Upload user data (text, photo, voice)
- `POST /train/{user_id}` - Start fine-tuning process
- `GET /train/{user_id}/status` - Get training status
- `POST /chat/{user_id}` - Send message to marionette
- `WS /ws/{user_id}` - WebSocket for real-time communication
- `GET /health` - Health check

### SadTalker Server (`/`)

- `POST /generate` - Generate talking head video
- `POST /generate_stream` - Stream video frames
- `GET /model_info` - Get model information
- `POST /optimize` - Optimize for real-time inference

## 🎨 Demo Script

1. **The Setup**: Show raw inputs (photo, text file, voice sample)
2. **The Resurrection**: Click "Resurrect" - watch instant RAG processing
3. **First Contact**: Marionette introduces itself
4. **The Turing Test**: Ask personal questions requiring nuanced understanding
5. **The Technical Reveal**: Show architecture, explain RAG vs fine-tuning

## 🏆 Hackathon Tracks

This project targets multiple hackathon tracks:

- **OpenAI Track**: Showcases fine-tuning API as core differentiator
- **ElevenLabs Track**: Voice cloning as seamless component
- **Prime Intellect Track**: GPU compute for SadTalker inference
- **Supabase Track**: Backend database + real-time updates

## ⚡ Performance Targets

- **Latency**: <3 seconds from input to video response
- **Quality**: Photorealistic face, natural voice, coherent personality
- **Stability**: Handle 5-minute conversations without crashes
- **Wow Factor**: Judges' visceral reaction when face comes alive

## 🚨 Risk Mitigation

- **SadTalker Issues**: Fallback to D-ID/HeyGen APIs
- **Fine-tuning Fails**: Fallback to GPT-4o with RAG
- **High Latency**: Pre-generate responses for demo
- **GPU Unavailable**: Alternative cloud providers

## 📝 License

MIT License - feel free to use this for your own hackathon projects!

## 🤝 Contributing

This is a hackathon project, but feel free to submit issues or improvements!

---

**Built for hackathons. Built to win. Built to amaze.**

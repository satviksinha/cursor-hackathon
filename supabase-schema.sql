-- Neural Marionette Database Schema
-- This file contains the SQL schema for Supabase tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'uploading',
    photo_path TEXT,
    voice_path TEXT,
    text_data TEXT,
    model_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training jobs table
CREATE TABLE training_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    openai_job_id TEXT NOT NULL,
    training_file_id TEXT,
    voice_id TEXT,
    status TEXT NOT NULL DEFAULT 'training',
    model_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Text embeddings table for RAG
CREATE TABLE text_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_training_jobs_user_id ON training_jobs(user_id);
CREATE INDEX idx_training_jobs_status ON training_jobs(status);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- Create indexes for text_embeddings
CREATE INDEX idx_text_embeddings_user_id ON text_embeddings(user_id);
CREATE INDEX idx_text_embeddings_chunk_index ON text_embeddings(user_id, chunk_index);
CREATE INDEX idx_text_embeddings_embedding ON text_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create storage bucket for training data
INSERT INTO storage.buckets (id, name, public) VALUES ('training-data', 'training-data', false);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_embeddings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Training jobs policies
CREATE POLICY "Users can view own training jobs" ON training_jobs FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own training jobs" ON training_jobs FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own training jobs" ON training_jobs FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Text embeddings policies
CREATE POLICY "Users can view own text embeddings" ON text_embeddings FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own text embeddings" ON text_embeddings FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own text embeddings" ON text_embeddings FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own text embeddings" ON text_embeddings FOR DELETE USING (auth.uid()::text = user_id::text);

-- Storage policies
CREATE POLICY "Users can upload own training data" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'training-data' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own training data" ON storage.objects FOR SELECT USING (
    bucket_id = 'training-data' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own training data" ON storage.objects FOR UPDATE USING (
    bucket_id = 'training-data' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own training data" ON storage.objects FOR DELETE USING (
    bucket_id = 'training-data' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_jobs_updated_at BEFORE UPDATE ON training_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for similarity search with pgvector
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5,
    user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    chunk_text TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.id,
        te.chunk_text,
        1 - (te.embedding <=> query_embedding) AS similarity,
        te.metadata
    FROM text_embeddings te
    WHERE 
        (user_id IS NULL OR te.user_id = user_id)
        AND 1 - (te.embedding <=> query_embedding) > match_threshold
    ORDER BY te.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

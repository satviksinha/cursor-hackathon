# Frontend Structure

This directory contains the complete frontend application for Neural Marionette.

## Directory Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── chat/[userId]/      # Chat interface
│   ├── onboarding/[userId]/ # Personality assessment
│   ├── training/[userId]/  # Training status
│   ├── voice-upload/[userId]/ # Voice upload
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/             # Reusable React components
│   ├── ui/                 # Basic UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Alert.tsx
│   │   └── LoadingSpinner.tsx
│   ├── chat/               # Chat-specific components
│   │   ├── Message.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatHeader.tsx
│   │   └── PersonalitySidebar.tsx
│   ├── onboarding/         # Onboarding components
│   │   ├── QuestionCard.tsx
│   │   └── ResultsCard.tsx
│   ├── voice-upload/       # Voice upload components
│   │   └── VoiceUpload.tsx
│   └── index.ts            # Component exports
├── lib/                    # Utility libraries
│   ├── api.ts              # API client functions
│   ├── auth.tsx            # Authentication context
│   └── supabase.ts         # Supabase client
├── public/                 # Static assets
│   ├── favicon.*           # Favicon files
│   ├── manifest.json       # PWA manifest
│   └── robots.txt          # SEO robots file
├── .env.local              # Environment variables
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── postcss.config.js       # PostCSS configuration
```

## Key Features

### Component Architecture

- **Modular Design**: Each component has a single responsibility
- **Reusable UI Components**: Button, Card, Alert, LoadingSpinner
- **Feature-Specific Components**: Chat, Onboarding, Voice Upload
- **TypeScript Support**: Full type safety across all components

### Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Dark Theme**: Consistent dark theme across all components
- **Responsive Design**: Mobile-first approach
- **Framer Motion**: Smooth animations and transitions

### State Management

- **React Hooks**: useState, useEffect, useContext
- **Context API**: Authentication state management
- **Local State**: Component-level state management

### API Integration

- **RESTful API**: Communication with Python backend
- **Supabase**: Database and authentication
- **ElevenLabs**: Text-to-speech functionality
- **Exa.ai**: Search functionality

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Running the Development Server

```bash
# From project root
npm run dev

# Or directly from frontend directory
cd frontend
npm run dev
```

### Building for Production

```bash
# From project root
npm run build

# Or directly from frontend directory
cd frontend
npm run build
```

### Linting

```bash
# From project root
npm run lint

# Or directly from frontend directory
cd frontend
npm run lint
```

## Environment Variables

The frontend requires the following environment variables (stored in `.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Component Usage

### Basic UI Components

```tsx
import { Button, Card, Alert, LoadingSpinner } from "@/components/ui";

// Button with variants
<Button variant="primary" size="lg">Click me</Button>
<Button variant="secondary" size="sm">Cancel</Button>

// Card with different variants
<Card variant="glass" padding="lg">
  <h2>Content</h2>
</Card>

// Alert with different types
<Alert type="success">Success message</Alert>
<Alert type="error">Error message</Alert>

// Loading spinner
<LoadingSpinner size="lg" />
```

### Feature Components

```tsx
import { Message, ChatInput, ChatHeader } from "@/components/chat";
import { QuestionCard, ResultsCard } from "@/components/onboarding";
import { VoiceUpload } from "@/components/voice-upload";

// Chat components
<ChatHeader userName="John" onToggleAudio={handleToggle} />
<Message message={messageData} onPlayAudio={handlePlay} />
<ChatInput onSendMessage={handleSend} isLoading={false} />

// Onboarding components
<QuestionCard question={question} onAnswerSelect={handleAnswer} />
<ResultsCard profile={profile} insights={insights} />

// Voice upload component
<VoiceUpload userId="user123" onUpload={handleUpload} />
```

## Architecture Benefits

### Maintainability

- **Clear Separation**: Frontend and backend are completely separated
- **Modular Components**: Easy to modify and extend individual components
- **Type Safety**: TypeScript prevents runtime errors
- **Consistent Styling**: Shared design system across all components

### Scalability

- **Component Reusability**: UI components can be used across different features
- **Easy Testing**: Individual components can be tested in isolation
- **Performance**: Code splitting and lazy loading support
- **Developer Experience**: Clear file structure and import paths

### Deployment

- **Independent Deployment**: Frontend can be deployed separately from backend
- **Static Generation**: Next.js supports static site generation
- **CDN Ready**: Static assets can be served from CDN
- **Environment Flexibility**: Easy to configure for different environments

// API utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  getQuestions: () => fetch(`${API_BASE_URL}/api/personality/questionnaire`),
  assessPersonality: (userId: string, answers: any) =>
    fetch(`${API_BASE_URL}/api/personality/assess/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }),
  getPersonalityProfile: (userId: string) =>
    fetch(`${API_BASE_URL}/api/personality/profile/${userId}`),
  sendPersonalizedChat: (userId: string, message: any) =>
    fetch(`${API_BASE_URL}/api/chat/personalized/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    }),
  textToSpeech: (userId: string, text: string) =>
    fetch(`${API_BASE_URL}/api/text-to-speech/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }),
};

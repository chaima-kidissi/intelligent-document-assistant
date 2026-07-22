export interface Source {
  file: string;
  page: number;
  score: number;
  excerpt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
  isVoiceMessage?: boolean;
  autoSpeak?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  activeDocument?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  question: string;
  active_document?: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
}

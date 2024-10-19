export interface FileData {
  id: number;
  title: string;
  type: string;
  content: any;
  size: number;
  extractedText: string;
  conversationId: string;
}

export interface DocumentInput {
  content: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  query: string;
  conversation_id: string;
}

export interface ChatResponse {
  answer: string;
  conversation_id: string;
  sources: string[];
}
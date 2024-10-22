export interface FileData {
  id: number;
  title: string;
  type: string;
  content: any;
  size: number;
  extractedText: string;
}

export interface DocumentInput {
  content: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  query: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
}
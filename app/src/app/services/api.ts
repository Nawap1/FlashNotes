// app/services/api.ts
import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Define types to match FastAPI endpoints
interface DocumentInput {
  content: string;
  metadata?: Record<string, any>;
}

interface ChatMessage {
  query: string;
  conversation_id: string;
}

interface ChatResponse {
  answer: string;
  conversation_id: string;
  sources: string[];
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const api = {
  async extractText(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post<{ text: string }>('/extract-text/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.text;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('File not found or could not be processed');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid file format or content');
        }
      }
      throw new Error('Failed to extract text from file');
    }
  },

  async addDocument(content: string, metadata: Record<string, any>): Promise<void> {
    try {
      const document: DocumentInput = {
        content,
        metadata
      };

      await axiosInstance.post('/add_document', document);
    } catch (error) {
      console.error('Error adding document:', error);
      throw new Error('Failed to add document to vector store');
    }
  },

  async chat(query: string, conversationId: string): Promise<ChatResponse> {
    try {
      const message: ChatMessage = {
        query,
        conversation_id: conversationId
      };

      const response = await axiosInstance.post<ChatResponse>('/chat', message);
      return response.data;
    } catch (error) {
      console.error('Error in chat:', error);
      throw new Error('Failed to get chat response');
    }
  },

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await axiosInstance.delete(`/conversations/${conversationId}`);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }
};
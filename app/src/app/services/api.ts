import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

// Add response interceptor to handle tokens globally
axiosInstance.interceptors.response.use(response => {
  if (response.data && response.data.answer) {
    response.data.answer = response.data.answer
      .replace(/<\|im_start\|>assistant\n/, '')
      .replace(/<\|im_end\|>/, '')
      .trim();
  }
  return response;
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
        const errorMessage = error.response?.data?.detail || 'Failed to extract text from file';
        throw new Error(errorMessage);
      }
      throw error;
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
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || 'Failed to add document to vector store';
        throw new Error(errorMessage);
      }
      throw error;
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
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || 'Failed to get chat response';
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await axiosInstance.delete(`/conversations/${conversationId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || 'Failed to delete conversation';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
};
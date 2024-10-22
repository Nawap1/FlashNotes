import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DocumentInput {
  content: string;
  metadata?: Record<string, any>;
}

interface ChatMessage {
  query: string;
}

interface ChatResponse {
  answer: string;
  sources: string[];
}

// Custom error class for API errors
class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 150000,
  maxContentLength: 50 * 1024 * 1024,
  maxBodyLength: 50 * 1024 * 1024,
});

// Add response interceptor for cleaning up chat responses
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data && response.data.answer) {
      response.data.answer = response.data.answer
        .replace(/<\|im_start\|>assistant\n/, '')
        .replace(/<\|im_end\|>/, '')
        .trim();
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
      console.error('[extractText Error]', error);
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to extract text from file');
    }
  },

  async addDocument(content: string, metadata: Record<string, any>): Promise<void> {
    try {
      // Ensure content is not empty or just whitespace
      if (!content || content.trim().length === 0) {
        throw new APIError('Document content cannot be empty');
      }
  
      // Construct the document with necessary formatting
      const document: DocumentInput = {
        content: content.trim(),
        metadata: {
          source: metadata?.source || `document_${Date.now()}.txt`, // Use current timestamp if no source is provided
          ...metadata, // Spread any additional metadata provided
        }
      };
  
      // Send the document via POST request
      await axiosInstance.post('/add_document', document);
      
    } catch (error) {
      console.error('[addDocument Error]', error);
  
      if (axios.isAxiosError(error)) {
        const serverErrorDetail = error.response?.data?.detail;
        const serverErrorStatus = error.response?.status;
  
        // Log server error response if available
        if (error.response?.data) {
          console.error('Server response:', error.response.data);
        }
  
        throw new APIError(
          serverErrorDetail || 'Failed to add document to vector store',
          serverErrorStatus
        );
      }
  
      // Rethrow API errors without masking them
      if (error instanceof APIError) {
        throw error;
      }
  
      // Handle other unexpected errors
      throw new APIError('An unexpected error occurred while adding the document');
    }
  },

  async chat(query: string): Promise<ChatResponse> {
    try {
      if (!query || query.trim().length === 0) {
        throw new APIError('Query cannot be empty');
      }

      const message: ChatMessage = {
        query: query.trim(),
      };

      const response = await axiosInstance.post<ChatResponse>('/chat', message);
      
      // Ensure the response has the expected structure
      if (!response.data || typeof response.data.answer !== 'string') {
        throw new APIError('Invalid response format from chat endpoint');
      }

      return {
        answer: response.data.answer,
        sources: response.data.sources || []
      };
    } catch (error) {
      console.error('[chat Error]', error);
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error instanceof Error ? error.message : 'Failed to get chat response'
      );
    }
  },


};

export type { ChatResponse, ChatMessage, DocumentInput };

import { useState, useEffect } from 'react';
import type { ChatMessage, FileData } from '@/types';

export const useChatSession = (selectedFile?: FileData) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Clear messages when switching files
  useEffect(() => {
    setMessages([]);
  }, [selectedFile?.id]);

  // Clear messages when component unmounts
  useEffect(() => {
    return () => {
      setMessages([]);
    };
  }, []);

  return {
    messages,
    setMessages,
    clearMessages: () => setMessages([]),
  };
};
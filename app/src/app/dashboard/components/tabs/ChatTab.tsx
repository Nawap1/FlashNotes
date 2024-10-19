import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/app/services/api';
import ReactMarkdown from 'react-markdown';
import type { FileData } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface ChatTabProps {
  selectedFile?: FileData;
}

export const ChatTab: React.FC<ChatTabProps> = ({ selectedFile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedFile?.conversationId) return;
    
    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsLoading(true);
    try {
      const response = await api.chat(userMessage, selectedFile.conversationId);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        sources: response.sources ? [response.sources[0]] : [] // Only keep the first source
      }]);
    } catch (error) {
      setError('Failed to get response. Please try again.');
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a file to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat container */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4 space-y-4 pb-20">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-200 mr-auto max-w-[80%]'
            }`}
          >
            {message.role === 'assistant' ? (
              <ReactMarkdown className="prose prose-sm max-w-none">
                {message.content}
              </ReactMarkdown>
            ) : (
              <p>{message.content}</p>
            )}
            {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-semibold">Source:</p>
                <p className="pl-2">{message.sources[0]}</p>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-center p-2">
            {error}
          </div>
        )}
      </div>

      {/* Input bar */}
      <form 
        onSubmit={handleSubmit} 
        className="bg-white p-4 border-t flex items-center space-x-2 sticky bottom-0 left-0 right-0"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your document..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

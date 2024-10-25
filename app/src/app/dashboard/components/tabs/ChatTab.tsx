import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '../../../services/api';
import ReactMarkdown from 'react-markdown';
import { dbService } from '../../../services/db';
import type { FileData, DocumentInput } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  sources?: string[];
  timestamp: number;
}

interface ChatTabProps {
  files: FileData[];
}

export const ChatTab: React.FC<ChatTabProps> = ({ files: initialFiles }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isProcessingDocs, setIsProcessingDocs] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasProcessedDocuments = useRef(false); // Track if documents have already been processed

  useEffect(() => {
    const processDocuments = async () => {
      try {
        setIsLoadingDocs(true);
        setIsProcessingDocs(true);

        const storedFiles = await dbService.getFiles();
        const mergedFiles = [...initialFiles];
        storedFiles.forEach(storedFile => {
          if (!mergedFiles.some(f => f.id === storedFile.id)) {
            mergedFiles.push(storedFile);
          }
        });
        setFiles(mergedFiles);

        const documents: DocumentInput[] = mergedFiles.map(file => ({
          content: file.extractedText,
          metadata: {
            title: file.title,
            type: file.type,
            id: file.id
          }
        }));

        await api.addDocuments(documents);
        setIsProcessingDocs(false);

        if (!hasProcessedDocuments.current) {  // Only add the message once
          addMessage(
            'assistant',
            'Documents processed and loaded successfully. You can now ask questions about your documents.'
          );
          hasProcessedDocuments.current = true;  // Set flag to true
        }
      } catch (err) {
        console.error('Error processing documents:', err);
        setError('Failed to process documents. Please try refreshing the page.');
        addMessage(
          'error',
          'Failed to process documents. Please try refreshing the page.'
        );
      } finally {
        setIsLoadingDocs(false);
      }
    };

    processDocuments();
  }, [initialFiles]);

  // Rest of the component remains the same...
  // Include all the existing functions and JSX from the original component

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  const addMessage = (role: Message['role'], content: string, sources?: string[]) => {
    const newMessage: Message = {
      id: generateMessageId(),
      role,
      content,
      sources,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userInput = input.trim();
    if (!userInput) return;

    setInput('');
    setError(null);
    
    // Add user message
    addMessage('user', userInput);
    
    setIsLoading(true);
    try {
      // Show typing indicator
      const typingId = generateMessageId();
      setMessages(prev => [...prev, {
        id: typingId,
        role: 'assistant',
        content: '...',
        timestamp: Date.now()
      }]);

      // Get response from API
      const response = await api.chat(userInput);
      
      // Remove typing indicator and add actual response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== typingId);
        return [...filtered, {
          id: generateMessageId(),
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          timestamp: Date.now()
        }];
      });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response. Please try again.';
      setError(errorMessage);
      addMessage('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  const renderMessage = (message: Message) => {
    const baseClasses = "p-4 rounded-lg max-w-[80%] relative group";
    const messageClasses = {
      user: `${baseClasses} bg-blue-100 ml-auto`,
      assistant: `${baseClasses} bg-gray-100 mr-auto`,
      error: `${baseClasses} bg-red-100 mx-auto text-red-600`
    };

    return (
      <div className={messageClasses[message.role]}>
        {/* Timestamp */}
        <div className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500">
          {formatTimestamp(message.timestamp)}
        </div>

        {/* Message Content */}
        {message.role === 'assistant' ? (
          <>
            <ReactMarkdown 
              className="prose prose-sm max-w-none dark:prose-invert"
              components={{
                p: ({ children }) => <p className="mb-2">{children}</p>,
                code: ({ children }) => (
                  <code className="dark:bg-gray-800 rounded px-1">{children}</code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            
            {message.sources && message.sources.length > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-2">
                <p className="text-sm font-semibold text-gray-600">Sources:</p>
                <div className="pl-2 space-y-1">
                  {message.sources.map((source, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      {source}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p>{message.content}</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {(isLoadingDocs || isProcessingDocs) && (
        <div className="flex flex-col items-center justify-center p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="text-sm text-gray-600">
            {isProcessingDocs ? 'Processing documents...' : 'Loading documents...'}
          </p>
        </div>
      )}

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-6"
      >
        {messages.map((message) => (
          <div key={message.id} className="relative">
            {renderMessage(message)}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="bg-white p-4 border-t flex items-center space-x-2 sticky bottom-0 left-0 right-0 shadow-lg"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isProcessingDocs ? "Processing documents..." : "Ask a question about your documents..."}
          className="flex-1"
          disabled={isLoading || isLoadingDocs || isProcessingDocs}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          disabled={isLoading || isLoadingDocs || isProcessingDocs || !input.trim()}
          className="px-4 py-2"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
"use client";
import React, { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/app/services/api';
import type { FileData } from '@/types';

interface FileUploadButtonProps {
  onFileUpload: (file: FileData) => void;
  variant?: "default" | "outline";
  size?: "default" | "icon";
}

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'text/plain': 'TXT'
};

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({ 
  onFileUpload, 
  variant = "default", 
  size = "default" 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      ACCEPTED_FILE_TYPES[file.type as keyof typeof ACCEPTED_FILE_TYPES]
    );

    if (validFiles.length === 0) {
      setError('Please select valid PDF, PPTX, or TXT files.');
      return;
    }

    setError(null);

    for (const file of validFiles) {
      setIsLoading(true);
      
      try {
        // Generate a unique conversation ID
        const conversationId = `conv_${Math.random().toString(36).substring(2, 15)}`;
        
        // Extract text from the document
        const extractedText = await api.extractText(file);
        
        // Add document to vector store with conversation ID
        await api.addDocument(extractedText, {
          filename: file.name,
          type: file.type,
          timestamp: new Date().toISOString(),
          conversation_id: conversationId,
          page: 1  // Add page number if available
        });

        // Create FileData object
        const newFile: FileData = {
          id: Date.now(),
          title: file.name,
          type: ACCEPTED_FILE_TYPES[file.type as keyof typeof ACCEPTED_FILE_TYPES],
          content: extractedText,
          size: file.size,
          extractedText,
          conversationId,
        };
        
        onFileUpload(newFile);

      } catch (error) {
        console.error('Error processing file:', error);
        setError(error instanceof Error ? error.message : 'Error processing file. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    event.target.value = '';
  };
  return (
    <div className="w-full max-w-md">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.pptx,.txt"
        className="hidden"
        multiple
      />
      
      <Button 
        onClick={handleClick} 
        variant={variant} 
        size={size} 
        disabled={isLoading}
        className="w-full"
      >
        <Upload 
          size={20} 
          className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} 
        />
        {isLoading ? 'Processing...' : 'Upload Documents'}
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
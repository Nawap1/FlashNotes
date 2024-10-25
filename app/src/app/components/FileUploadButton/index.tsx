// src/app/components/FileUploadButton/index.tsx
"use client";
import React, { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/app/services/api';
import type { FileData } from '@/types';
import { Progress } from '@/components/ui/progress'; // Make sure to import Progress from shadcn/ui

interface FileUploadButtonProps {
  onFileUpload: (files: FileData[]) => void;
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
  const [progress, setProgress] = useState(0);
  const [processingFile, setProcessingFile] = useState('');

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
    setIsLoading(true);
    const processedFiles: FileData[] = [];
    
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setProcessingFile(file.name);
        setProgress((i / validFiles.length) * 100);
        
        // Extract text from the document
        const extractedText = await api.extractText(file);

        // Create FileData object
        const newFile: FileData = {
          id: Date.now() + i, // Temporary ID, will be replaced by DB
          title: file.name,
          type: ACCEPTED_FILE_TYPES[file.type as keyof typeof ACCEPTED_FILE_TYPES],
          content: extractedText,
          size: file.size,
          extractedText,
        };
        
        processedFiles.push(newFile);
      }
      
      setProgress(100);
      onFileUpload(processedFiles);

    } catch (error) {
      console.error('Error processing files:', error);
      setError(error instanceof Error ? error.message : 'Error processing files. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(0);
      setProcessingFile('');
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

      {isLoading && (
        <div className="mt-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-400 mt-2">
            Processing: {processingFile}
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
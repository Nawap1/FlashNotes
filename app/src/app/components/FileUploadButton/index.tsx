"use client";
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => ACCEPTED_FILE_TYPES[file.type as keyof typeof ACCEPTED_FILE_TYPES]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: FileData = {
          id: Date.now(),
          title: file.name,
          type: ACCEPTED_FILE_TYPES[file.type as keyof typeof ACCEPTED_FILE_TYPES],
          content: e.target?.result,
          size: file.size
        };
        onFileUpload(newFile);
      };
      reader.readAsArrayBuffer(file);
    });
    
    event.target.value = '';
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.pptx,.txt"
        className="hidden"
        multiple
      />
      <Button onClick={handleClick} variant={variant} size={size}>
        <Upload size={20}/>
      </Button>
    </>
  );
};
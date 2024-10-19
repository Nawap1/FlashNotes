"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { MainContent } from './MainContent';
import type { FileData } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function DashboardContent() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | undefined>();
  const [error, setError] = useState('');
  const router = useRouter();

  // Load files from localStorage and only redirect if no files exist
  useEffect(() => {
    const savedFiles = JSON.parse(localStorage.getItem('flashNotes') || '[]');
    setFiles(savedFiles);
    
    // Only redirect if there are no files
    if (savedFiles.length === 0) {
      router.push('/');
    }
  }, [router]);

  const handleFileUpload = (newFile: FileData) => {
    if (newFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    localStorage.setItem('flashNotes', JSON.stringify(updatedFiles));
    setSelectedFile(newFile); // Automatically select newly uploaded file
    setError('');
  };

  const handleFileSelect = (file: FileData) => {
    setSelectedFile(file);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        files={files} 
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onFileUpload={handleFileUpload}
        error={error}
      />
      <MainContent selectedFile={selectedFile} />
    </div>
  );
}
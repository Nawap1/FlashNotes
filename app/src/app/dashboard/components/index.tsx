"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { MainContent } from './MainContent';
import type { FileData } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const STORAGE_KEY = 'flashNotes';

export default function DashboardContent() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | undefined>();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load files from localStorage
  useEffect(() => {
    try {
      const savedFiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setFiles(savedFiles);
      
      // If there are files, select the first one
      if (savedFiles.length > 0) {
        setSelectedFile(savedFiles[0]);
      } else {
        // Only redirect if there are no files and we're done loading
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading files from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
      setFiles([]);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleFileUpload = (newFile: FileData) => {
    if (newFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (files.some(file => file.name === newFile.name)) {
      setError('A file with this name already exists');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const updatedFiles = [...files, newFile];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
      setFiles(updatedFiles);
      setSelectedFile(newFile);
      setError('');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      setError('Failed to save file. Storage might be full.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFileSelect = (file: FileData) => {
    setSelectedFile(file);
  };

  const handleFileDelete = (fileToDelete: FileData) => {
    const updatedFiles = files.filter(file => file.name !== fileToDelete.name);
    setFiles(updatedFiles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
    
    if (selectedFile?.name === fileToDelete.name) {
      setSelectedFile(updatedFiles[0] || undefined);
    }

    if (updatedFiles.length === 0) {
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        files={files} 
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onFileUpload={handleFileUpload}
        onFileDelete={handleFileDelete}
        error={error}
      />


      <div className="flex-grow overflow-y-auto">
        <MainContent selectedFile={selectedFile} />
      </div>
    </div>
  );
}
// src/app/dashboard/components/index.tsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { MainContent } from './MainContent';
import { dbService } from '@/app/services/db';
import type { FileData } from '@/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; 

export default function DashboardContent() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | undefined>();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load files from IndexedDB
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const savedFiles = await dbService.getFiles();
        setFiles(savedFiles);
        
        // If there are files, select the first one
        if (savedFiles.length > 0) {
          setSelectedFile(savedFiles[0]);
        } else {
          // Only redirect if there are no files and we're done loading
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading files from IndexedDB:', error);
        setFiles([]);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [router]);

  const handleFileUpload = async (newFile: Omit<FileData, 'id'>) => {
    if (newFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 50MB limit');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (files.some(file => file.title === newFile.title)) {
      setError('A file with this name already exists');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const [id] = await dbService.addFiles([newFile]);
      const fileWithId = { ...newFile, id };
      setFiles(prev => [...prev, fileWithId]);
      setSelectedFile(fileWithId);
      setError('');
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
      setError('Failed to save file. Database error occurred.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFileSelect = (file: FileData) => {
    setSelectedFile(file);
  };

  const handleFileDelete = async (fileToDelete: FileData) => {
    try {
      if (fileToDelete.id) {
        await dbService.deleteFile(fileToDelete.id);
        const updatedFiles = files.filter(file => file.id !== fileToDelete.id);
        setFiles(updatedFiles);
        
        if (selectedFile?.id === fileToDelete.id) {
          setSelectedFile(updatedFiles[0] || undefined);
        }

        if (updatedFiles.length === 0) {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
      setTimeout(() => setError(''), 3000);
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
        <MainContent selectedFile={selectedFile} files = {files} />
      </div>
    </div>
  );
}
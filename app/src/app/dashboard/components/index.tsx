"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/app/components/Sidebar';
import { MainContent } from './MainContent';
import type { FileData } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default function DashboardContent() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedFiles = JSON.parse(localStorage.getItem('flashNotes') || '[]');
    if (savedFiles.length === 0) {
      router.push('/');
      return;
    }
    setFiles(savedFiles);
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
    setError('');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        files={files} 
        onFileUpload={handleFileUpload}
        error={error}
      />
      <MainContent />
    </div>
  );
}
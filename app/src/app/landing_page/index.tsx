// src/app/landing_page/index.tsx
"use client";
import { useRouter } from 'next/navigation';
import { LandingContent } from './components/LandingContent';
import type { FileData } from '@/types';
import { dbService } from '@/app/services/db';

export default function FlashNotes() {
  const router = useRouter();

  const handleFileUpload = async (newFiles: Omit<FileData, 'id'>[]) => {
    try {
      // Store the files in IndexedDB
      await dbService.addFiles(newFiles);
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Database error:', error);
      alert('Error saving files. Please try again.');
    }
  };

  return <LandingContent onFileUpload={handleFileUpload} />;
}
"use client";
import { useRouter } from 'next/navigation';
import { LandingContent } from './components/LandingContent';
import type { FileData } from '@/types';

export default function FlashNotes() {
  const router = useRouter();

  const handleFileUpload = (newFile: FileData) => {
    const existingFiles = JSON.parse(localStorage.getItem('flashNotes') || '[]');
    localStorage.setItem('flashNotes', JSON.stringify([...existingFiles, newFile]));
    router.push('/dashboard');
  };

  return <LandingContent onFileUpload={handleFileUpload} />;
}
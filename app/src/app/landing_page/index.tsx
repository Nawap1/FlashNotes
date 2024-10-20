"use client";
import { useRouter } from 'next/navigation';
import { LandingContent } from './components/LandingContent';
import type { FileData } from '@/types';

export default function FlashNotes() {
  const router = useRouter();

  const handleFileUpload = async (newFile: FileData) => {
    try {
      // Store the file data in localStorage
      const existingFiles = JSON.parse(localStorage.getItem('flashNotes') || '[]');
      const updatedFiles = [...existingFiles, newFile];
      localStorage.setItem('flashNotes', JSON.stringify(updatedFiles));
      
      // Use only router.push for navigation
      router.push('/dashboard');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Error navigating to dashboard. Please try again.');
    }
  };

  return <LandingContent onFileUpload={handleFileUpload} />;
}
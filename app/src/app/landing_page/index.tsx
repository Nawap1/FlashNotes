// app/landing_page/index.tsx
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
      
      // Navigate to dashboard using both methods to ensure it works
      window.location.href = '/dashboard';
      
      // Fallback navigation
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Error navigating to dashboard. Please try again.');
    }
  };

  return <LandingContent onFileUpload={handleFileUpload} />;
}
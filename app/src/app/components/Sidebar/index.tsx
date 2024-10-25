//src/app/components/Sidebar/index.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { FileUploadButton } from '../FileUploadButton';
import { FileList } from './FileList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, FolderUp } from 'lucide-react';
import type { FileData } from '@/types';
import { dbService } from '@/app/services/db';

interface SidebarProps {
  files: FileData[];
  selectedFile?: FileData;
  onFileSelect: (file: FileData) => void;
  onFileUpload: (file: Omit<FileData, 'id'>) => void;
  onFileDelete: (file: FileData) => void;
  onClearAll?: () => void;
  error: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFile,
  onFileSelect,
  onFileUpload,
  onFileDelete,
  onClearAll,
  error
}) => {
  const router = useRouter();

  const handleClearAll = async () => {
    try {
      // Use the new bulk delete method
      await dbService.deleteAllFiles();
      
      // If parent component provided onClearAll handler, use it
      if (onClearAll) {
        onClearAll();
      } else {
        // Otherwise, notify about each file deletion
        files.forEach(file => onFileDelete(file));
      }

      // Navigate to home page after successful deletion
      router.push('/');
      
    } catch (error) {
      console.error('Failed to clear all files:', error);
    }
  };

  return (
    <div className="w-64 bg-gray-900 min-h-screen border-r border-gray-800">
      {/* Top gradient bar */}
      <div className="h-1 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />

      <div className="p-4">
        {/* Header Section */}
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              <span className="text-white">Flash</span>
              <span className="text-gray-400">Notes</span>
            </h1>
          </div>

          {/* Upload and Clear Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <FileUploadButton
                onFileUpload={onFileUpload}
                variant="outline"
                size="icon"
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600 transition-colors flex items-center justify-center py-2"
              >
                <FolderUp className="w-4 h-4 mr-2" />
                Upload File
              </FileUploadButton>
            </div>

            {files.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center justify-center space-x-2 text-sm text-red-400 hover:text-red-300 transition-colors py-2 px-4 rounded-md bg-gray-800 hover:bg-gray-700"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Files</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="my-4 bg-red-900/50 border-red-800 text-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Divider */}
        <div className="my-4 border-t border-gray-800" />

        {/* File List Section */}
        <div className="mt-4">
          <FileList
            files={files}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            onFileDelete={onFileDelete}
          />
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div className="h-1 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
    </div>
  );
};
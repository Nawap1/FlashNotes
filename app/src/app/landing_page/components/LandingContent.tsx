import React from 'react';
import { FileUploadButton } from '@/app/components/FileUploadButton';
import { BookOpen, Upload, Brain } from 'lucide-react';

interface LandingContentProps {
  onFileUpload: (file: FileData) => void;
}

export const LandingContent: React.FC<LandingContentProps> = ({ onFileUpload }) => (
  <div className="min-h-screen bg-black">
    {/* Top decorative bar */}
    <div className="h-2 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700" />
    
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Flash
            <span className="text-gray-400">Notes</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Transform your documents into interactive learning experiences.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="bg-gray-900 p-6 rounded-lg text-center">
            <div className="bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="text-white w-6 h-6" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Upload</h3>
            <p className="text-gray-400 text-sm">Share your documents seamlessly</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg text-center">
            <div className="bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Learn</h3>
            <p className="text-gray-400 text-sm">Interactive learning experience</p>
            <p className="text-gray-400 text-sm">Chat</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg text-center">
            <div className="bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="text-white w-6 h-6" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Summarize</h3>
            <p className="text-gray-400 text-sm">Create summary on a click</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg text-center">
            <div className="bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="text-white w-6 h-6" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Master</h3>
            <p className="text-gray-400 text-sm">Test your knowledge</p>
            <p className="text-gray-400 text-sm">on MCQ</p>
          </div>
        </div>
        

        {/* Upload Section */}
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              Start Your Learning Journey
            </h2>
            <div className="mb-6">
              <FileUploadButton onFileUpload={onFileUpload} />
            </div>
            <p className="text-sm text-gray-400">
              Supported formats: PDF, PPTX, TXT
            </p>
          </div>
        </div>
      </div>
    </div>
    
    {/* Bottom decorative bar */}
    <div className="h-2 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700" />
  </div>
);

export default LandingContent;
import { FileUploadButton } from '@/app/components/FileUploadButton';

interface LandingContentProps {
  onFileUpload: (file: FileData) => void;
}

export const LandingContent: React.FC<LandingContentProps> = ({ onFileUpload }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <h1 className="text-4xl font-bold mb-4">Flash Notes</h1>
    <p className="text-xl text-center mb-8 max-w-md">
      Transform your documents into interactive learning experiences. Upload, chat, summarize, and quiz yourself on any content.
    </p>
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-center space-x-4">
        <FileUploadButton onFileUpload={onFileUpload} />
      </div>
      <p className="text-sm text-gray-500 text-center">
        Supported formats: PDF, PPTX, TXT
      </p>
    </div>
  </div>
);
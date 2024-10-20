import { FileUploadButton } from '../FileUploadButton';
import { FileList } from './FileList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FileData } from '@/types';

interface SidebarProps {
  files: FileData[];
  selectedFile?: FileData;
  onFileSelect: (file: FileData) => void;
  onFileUpload: (file: FileData) => void;
  onFileDelete: (file: FileData) => void;
  error: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  files, 
  selectedFile,
  onFileSelect,
  onFileUpload,
  onFileDelete,
  error 
}) => {
  const handleClearAll = () => {
    files.forEach(file => onFileDelete(file));
  };

  return (
    <div className="w-64 bg-white p-4 border-r">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Flash Notes</h1>
          <FileUploadButton 
            onFileUpload={onFileUpload} 
            variant="outline" 
            size="icon"
          />
        </div>
        
        {files.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            Clear All Files
          </button>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FileList 
        files={files}
        selectedFile={selectedFile}
        onFileSelect={onFileSelect}
        onFileDelete={onFileDelete}
      />
    </div>
  );
};
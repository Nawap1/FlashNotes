import { FileUploadButton } from '../FileUploadButton';
import { FileList } from './FileList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FileData } from '@/types';

interface SidebarProps {
  files: FileData[];
  onFileUpload: (file: FileData) => void;
  error: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ files, onFileUpload, error }) => (
  <div className="w-64 bg-white p-4 border-r">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-bold">Flash Notes</h1>
      <FileUploadButton 
        onFileUpload={onFileUpload} 
        variant="outline" 
        size="icon"
      />
    </div>
    
    {error && (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

    <FileList files={files} />
  </div>
);
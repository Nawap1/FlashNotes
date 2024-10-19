import { File } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { FileData } from '@/types';

interface FileListProps {
  files: FileData[];
  selectedFile?: FileData;
  onFileSelect: (file: FileData) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, selectedFile, onFileSelect }) => (
  <div className="space-y-2">
    {files.map(file => (
      <Card 
        key={file.id} 
        className={`cursor-pointer transition-colors ${
          selectedFile?.id === file.id 
            ? 'bg-blue-50 border-blue-200' 
            : 'hover:bg-gray-50'
        }`}
        onClick={() => onFileSelect(file)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <File size={16} />
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {file.type}
            </span>
            <span className="text-sm truncate">{file.title}</span>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
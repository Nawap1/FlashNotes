// src/app/components/Sidebar/FileList.tsx
import { File, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { FileData } from '@/types';

interface FileListProps {
  files: FileData[];
  selectedFile?: FileData;
  onFileSelect: (file: FileData) => void;
  onFileDelete: (file: FileData) => void;
}

export const FileList: React.FC<FileListProps> = ({ 
  files, 
  selectedFile, 
  onFileSelect,
  onFileDelete 
}) => (
  <div className="space-y-2">
    {files.map(file => (
      <Card 
        key={file.id} 
        className={`cursor-pointer transition-colors ${
          selectedFile?.id === file.id 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-900 border-gray-800 hover:bg-gray-800'
        }`}
      >
        <CardContent className="p-3 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 flex-grow"
            onClick={() => onFileSelect(file)}
          >
            <File size={16} className="text-gray-400" />
            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
              {file.type}
            </span>
            <span className="text-sm truncate text-gray-300">{file.title}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileDelete(file);
            }}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </CardContent>
      </Card>
    ))}
  </div>
);
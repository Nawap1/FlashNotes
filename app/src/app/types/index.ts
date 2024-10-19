export interface FileData {
    id: number;
    title: string;
    type: 'PDF' | 'PPTX' | 'TXT';
    content: ArrayBuffer | string | null;
    size: number;
  }
  
  export type TabType = 'chat' | 'summary' | 'quiz';
  
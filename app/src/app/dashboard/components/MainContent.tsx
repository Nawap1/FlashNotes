// app/dashboard/components/MainContent.tsx
"use client";
import { useState } from 'react';
import { MessageSquare, FileText, BrainCircuit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatTab } from './tabs/ChatTab';
import { SummaryTab } from './tabs/SummaryTab';
import { QuizTab } from './tabs/QuizTab';
import type { TabType, FileData } from '@/types';

interface MainContentProps {
  selectedFile?: FileData;
}

export const MainContent: React.FC<MainContentProps> = ({ selectedFile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  return (
    <div className="flex-1 p-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
        <TabsList className="mb-6">
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="summary">
            <FileText className="w-4 h-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <BrainCircuit className="w-4 h-4 mr-2" />
            Quiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <ChatTab selectedFile={selectedFile} />
        </TabsContent>
        <TabsContent value="summary">
          <SummaryTab />
        </TabsContent>
        <TabsContent value="quiz">
          <QuizTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

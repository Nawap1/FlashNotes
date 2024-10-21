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
        <TabsList 
        style={{
          // margin: '10 auto',
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          margin: '0 auto',
        }}
        className="mb-6 flex-shrink-0 sticky top-3 z-10 bg-white">
          <TabsTrigger 
          style={{
            padding: '0.5rem 1rem',
            borderBottom: '2px solid',
            borderColor: activeTab === 'chat' ? '#36454F' : 'transparent',

            flex: 1
          }}
          value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger 
          style={{
            padding: '0.5rem 1rem',
            borderBottom: '2px solid',
            borderColor: activeTab === 'summary' ? '#36454F' : 'transparent',
            flex: 1
          }}
          value="summary">
            <FileText className="w-4 h-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger 
          style={{
            padding: '0.5rem 1rem',
            borderBottom: '2px solid',
            borderColor: activeTab === 'quiz' ? '#36454F' : 'transparent',
            flex: 1
          }}
          value="quiz">
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

"use client";
import React, { useState } from 'react';
import { Upload, MessageSquare, Book, BrainCircuit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const LandingPage = ({ onFileUpload }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    <h1 className="text-4xl font-bold mb-4">Flash Notes</h1>
    <p className="text-xl text-center mb-8 max-w-md">
      Transform your documents into interactive learning experiences. Upload, chat, summarize, and quiz yourself on any content.
    </p>
    <Button onClick={onFileUpload} className="flex items-center gap-2">
      <Upload size={20} />
      Upload Documents
    </Button>
  </div>
);

const MainApp = ({ files, onFileUpload }) => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white p-4 border-r">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Flash Notes</h1>
          <Button variant="outline" size="icon" onClick={onFileUpload}>
            <Upload size={20} />
          </Button>
        </div>
        
        {/* File List */}
        <div className="space-y-2">
          {files.map(file => (
            <Card key={file.id} className="cursor-pointer hover:bg-gray-50">
              <CardContent className="p-3">
                <div className="flex items-center">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                    {file.type}
                  </span>
                  <span className="text-sm truncate">{file.title}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="justify-start px-4 py-2 bg-white border-b">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare size={18} /> Chat
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Book size={18} /> Summary
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <BrainCircuit size={18} /> Quiz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 p-4">
            <Card>
              <CardContent className="p-4">
                Chat functionality would be implemented here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="flex-1 p-4">
            <Card>
              <CardContent className="p-4">
                Summary functionality would be implemented here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quiz" className="flex-1 p-4">
            <Card>
              <CardContent className="p-4">
                Quiz functionality would be implemented here.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default function FlashNotes() {
  const [files, setFiles] = useState([]);

  const handleFileUpload = () => {
    // Simulate file upload
    const newFile = { 
      id: files.length + 1, 
      title: `Document ${files.length + 1}.pdf`, 
      type: 'PDF' 
    };
    setFiles([...files, newFile]);
  };

  return files.length === 0 ? (
    <LandingPage onFileUpload={handleFileUpload} />
  ) : (
    <MainApp files={files} onFileUpload={handleFileUpload} />
  );
}

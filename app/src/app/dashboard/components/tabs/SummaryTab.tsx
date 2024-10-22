import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Loader2, BookOpen, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/app/services/api';
import ReactMarkdown from 'react-markdown';

interface SummaryTabProps {
  selectedFile: {
    content: string;
    name: string;
  } | null;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ selectedFile }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDocumentAdded, setIsDocumentAdded] = useState(false);

  const generateSummary = async () => {
    if (!selectedFile?.content) {
      setError('Please select a file to generate a summary');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!isDocumentAdded) {
        await api.addDocument(selectedFile.content, {
          source: selectedFile.name || 'document.txt'
        });
        setIsDocumentAdded(true);
      }
      
      const summaryResponse = await fetch('http://localhost:8000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: selectedFile.content
        })
      });

      if (!summaryResponse.ok) {
        throw new Error(`HTTP error! status: ${summaryResponse.status}`);
      }

      const data = await summaryResponse.json();
      setSummary(data.summary);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSummary('');
    setIsDocumentAdded(false);
  }, [selectedFile]);

  if (!selectedFile) {
    return (
      <Card className="w-full bg-gray-50 border-2 border-dashed">
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Document Selected</h3>
          <p className="text-gray-500">Select a document to view its summary</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-gray-700" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Document Summary</h3>
                <p className="text-sm text-gray-500">Currently viewing: {selectedFile.name}</p>
              </div>
            </div>
            <Button
              onClick={generateSummary}
              disabled={loading}
              className="bg-gray-900 hover:bg-gray-800 transform transition-transform hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-4">
            {summary ? (
              <div className="prose prose-gray max-w-none bg-gray-50 rounded-lg p-6">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                    li: ({ children }) => <li className="mb-2">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 italic">{children}</blockquote>
                    ),
                  }}
                >
                  {summary}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center bg-gray-50 rounded-lg p-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">Ready to generate summary</p>
                <p className="text-sm text-gray-500">
                  Click 'Generate Summary' to create a comprehensive summary of your document
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryTab;
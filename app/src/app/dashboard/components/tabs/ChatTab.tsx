import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export const ChatTab = () => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col h-[550px]">
          <div className="flex-1 overflow-y-auto mb-4">
            {/* Chat messages will go here */}
            <p className="text-center text-gray-500">
              Select a document to start chatting
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question about your document..."
              className="flex-1"
            />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const QuizTab = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            Select a document to generate quiz questions
          </p>
          <Button>Generate Quiz</Button>
        </div>
      </CardContent>
    </Card>
  );
};
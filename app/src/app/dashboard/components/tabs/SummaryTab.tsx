import { Card, CardContent } from '@/components/ui/card';

export const SummaryTab = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-center text-gray-500">
          Select a document to view its summary
        </p>
      </CardContent>
    </Card>
  );
};
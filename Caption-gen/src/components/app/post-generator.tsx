import type { GenerateSocialMediaPostOutput } from '@/ai/flows/generate-social-media-post';
import { GeneratedPostCard } from './generated-post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Bot } from 'lucide-react';

type PostGeneratorProps = {
  isGenerating: boolean;
  post: GenerateSocialMediaPostOutput | null;
  onApprove: (post: GenerateSocialMediaPostOutput) => void;
  onReject: () => void;
};

function GeneratedPostSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="aspect-video w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  );
}

export function PostGenerator({ isGenerating, post, onApprove, onReject }: PostGeneratorProps) {
  if (isGenerating) {
    return <GeneratedPostSkeleton />;
  }

  if (post) {
    return <GeneratedPostCard post={post} onApprove={onApprove} onReject={onReject} />;
  }

  return (
    <div className="flex h-full min-h-[500px] items-center justify-center rounded-lg border-2 border-dashed bg-card">
      <div className="text-center text-muted-foreground">
        <Bot className="mx-auto h-12 w-12" />
        <h3 className="mt-4 text-lg font-semibold">AI Assistant</h3>
        <p className="mt-2 text-sm">Generate a post to see the AI's suggestion here.</p>
      </div>
    </div>
  );
}

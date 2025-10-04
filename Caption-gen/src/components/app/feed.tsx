import { FeedPostCard } from './feed-post-card';
import type { ApprovedPost } from '@/lib/types';
import { Newspaper } from 'lucide-react';

type FeedProps = {
  posts: ApprovedPost[];
};

export function Feed({ posts }: FeedProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Approved Feed</h2>
      {posts.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <Newspaper className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Your Feed is Empty</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Approve AI-generated posts to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

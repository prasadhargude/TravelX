import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { ApprovedPost } from '@/lib/types';

type FeedPostCardProps = {
  post: ApprovedPost;
};

export function FeedPostCard({ post }: FeedPostCardProps) {
  return (
    <Card className="animate-in fade-in-50">
      <CardContent className="p-4 space-y-4">
        <div className="aspect-video overflow-hidden rounded-md border">
            <Image
            src={post.image}
            alt="Approved post image"
            width={1280}
            height={720}
            className="h-full w-full object-cover"
            />
        </div>
        <p className="text-sm">{post.caption}</p>
      </CardContent>
    </Card>
  );
}

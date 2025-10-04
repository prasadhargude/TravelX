'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, Edit, Save, X } from 'lucide-react';
import type { GenerateSocialMediaPostOutput } from '@/ai/flows/generate-social-media-post';

type GeneratedPostCardProps = {
  post: GenerateSocialMediaPostOutput;
  onApprove: (post: GenerateSocialMediaPostOutput) => void;
  onReject: () => void;
};

export function GeneratedPostCard({ post, onApprove, onReject }: GeneratedPostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleApprove = () => {
    onApprove({ ...post, caption: editedCaption });
  };

  return (
    <Card className="shadow-lg animate-in fade-in-50">
      <CardHeader>
        <CardTitle>AI Generated Post</CardTitle>
        <CardDescription>Review, edit, and approve the post below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video overflow-hidden rounded-lg border">
            <Image
            src={post.image}
            alt="AI generated image"
            width={1280}
            height={720}
            className="h-full w-full object-cover"
            />
        </div>
        <div>
          {isEditing ? (
            <Textarea
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              rows={4}
              className="text-base"
            />
          ) : (
            <p className="text-base leading-relaxed">{editedCaption}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="icon" onClick={onReject}>
          <X className="h-5 w-5" />
          <span className="sr-only">Reject</span>
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <Button onClick={handleSave} variant="secondary">
              <Save className="mr-2" />
              Save
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="mr-2" />
              Edit
            </Button>
          )}
          <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
            <Check className="mr-2" />
            Approve
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

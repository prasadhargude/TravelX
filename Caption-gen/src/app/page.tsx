"use client";

import { useState, useTransition } from 'react';
import { AppHeader } from '@/components/app/header';
import { JourneySimulator } from '@/components/app/journey-simulator';
import { PostGenerator } from '@/components/app/post-generator';
import { Feed } from '@/components/app/feed';
import { journeyData, type JourneyMoment } from '@/lib/data';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { generatePostAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { GenerateSocialMediaPostOutput } from '@/ai/flows/generate-social-media-post';
import type { ApprovedPost } from '@/lib/types';

export default function Home() {
  const [currentMomentIndex, setCurrentMomentIndex] = useState(0);
  const [generatedPost, setGeneratedPost] = useState<GenerateSocialMediaPostOutput | null>(null);
  const [approvedPosts, setApprovedPosts] = useState<ApprovedPost[]>([]);
  const [isGenerating, startTransition] = useTransition();
  const { toast } = useToast();

  const currentJourneyMoment = journeyData[currentMomentIndex];
  const currentImage = PlaceHolderImages.find(img => img.id === currentJourneyMoment.imageId)!;

  const handleGeneratePost = () => {
    startTransition(async () => {
      setGeneratedPost(null);
      const input = {
        ...currentJourneyMoment.metadata,
        image: currentImage.imageUrl,
      };
      const result = await generatePostAction(input);

      if (result && 'caption' in result) {
        setGeneratedPost(result);
      } else {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: (result as any).error || "An unknown error occurred.",
        });
      }
    });
  };

  const advanceToNextMoment = () => {
    setGeneratedPost(null);
    setCurrentMomentIndex((prevIndex) => (prevIndex + 1) % journeyData.length);
  };

  const handleApprove = (post: GenerateSocialMediaPostOutput) => {
    setApprovedPosts(prevPosts => [{ ...post, id: Date.now() }, ...prevPosts]);
    advanceToNextMoment();
    toast({
      title: "Post Approved!",
      description: "It has been added to your feed.",
    });
  };

  const handleReject = () => {
    advanceToNextMoment();
    toast({
      title: "Post Rejected",
      description: "The generated post has been discarded."
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex-1 container py-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col gap-8">
            <JourneySimulator
              moment={currentJourneyMoment}
              image={currentImage}
              onGenerate={handleGeneratePost}
              isActionable={!isGenerating && !generatedPost}
            />
             <div className="lg:hidden">
              <PostGenerator
                isGenerating={isGenerating}
                post={generatedPost}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </div>
            <Feed posts={approvedPosts} />
          </div>
          <div className="hidden lg:block sticky top-24 self-start">
             <PostGenerator
                isGenerating={isGenerating}
                post={generatedPost}
                onApprove={handleApprove}
                onReject={handleReject}
              />
          </div>
        </div>
      </main>
    </div>
  );
}

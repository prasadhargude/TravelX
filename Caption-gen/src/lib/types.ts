import type { GenerateSocialMediaPostOutput } from '@/ai/flows/generate-social-media-post';

export type ApprovedPost = GenerateSocialMediaPostOutput & { id: number };

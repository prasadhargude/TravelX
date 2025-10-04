'use server';

import { generateSocialMediaPost, type GenerateSocialMediaPostInput } from '@/ai/flows/generate-social-media-post';
import { z } from 'zod';

// We only need the image URL from the client, the rest is the same as GenerateSocialMediaPostInput
const ActionInputSchema = z.object({
  scene: z.string(),
  mood: z.string(),
  location: z.string(),
  weather: z.string(),
  event: z.string(),
  image: z.string().url(),
});

export async function generatePostAction(input: z.infer<typeof ActionInputSchema>) {
  try {
    const validatedInput = ActionInputSchema.parse(input);

    // The AI flow is designed to accept a data URI.
    // Fetch the image URL and convert it to a data URI.
    const imageResponse = await fetch(validatedInput.image);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
    const dataUri = `data:${imageBlob.type};base64,${imageBuffer.toString('base64')}`;

    const aiInput: GenerateSocialMediaPostInput = { ...validatedInput, image: dataUri };

    const result = await generateSocialMediaPost(aiInput);
    return result;
  } catch (error) {
    console.error('Error generating social media post:', error);
    if (error instanceof z.ZodError) {
      return { error: 'Invalid input provided.' };
    }
    return { error: 'Failed to generate post. The AI model might be unavailable.' };
  }
}

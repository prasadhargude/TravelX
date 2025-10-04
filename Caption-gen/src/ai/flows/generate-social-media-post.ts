'use server';
/**
 * @fileOverview An AI agent for generating social media posts based on driving scene, mood, and metadata.
 *
 * - generateSocialMediaPost - A function that handles the generation of social media posts.
 * - GenerateSocialMediaPostInput - The input type for the generateSocialMediaPost function.
 * - GenerateSocialMediaPostOutput - The return type for the generateSocialMediaPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialMediaPostInputSchema = z.object({
  scene: z.string().describe('The current driving scene (e.g., sunset highway drive).'),
  mood: z.string().describe("The driver's mood (e.g., happy, excited)."),
  location: z.string().describe('The current location (e.g., Highway).'),
  weather: z.string().describe('The current weather (e.g., Sunny).'),
  event: z.string().describe('A description of the current event (e.g., Sunset drive with friends).'),
  image: z.string().describe("A photo of the scene, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateSocialMediaPostInput = z.infer<typeof GenerateSocialMediaPostInputSchema>;

const GenerateSocialMediaPostOutputSchema = z.object({
  caption: z.string().describe('The generated caption for the social media post.'),
  image: z.string().describe('The generated or modified image for the social media post, as a data URI.'),
});
export type GenerateSocialMediaPostOutput = z.infer<typeof GenerateSocialMediaPostOutputSchema>;

export async function generateSocialMediaPost(input: GenerateSocialMediaPostInput): Promise<GenerateSocialMediaPostOutput> {
  return generateSocialMediaPostFlow(input);
}

const generateSocialMediaPostFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaPostFlow',
    inputSchema: GenerateSocialMediaPostInputSchema,
    outputSchema: GenerateSocialMediaPostOutputSchema,
  },
  async input => {
    const llmResponse = await ai.generate({
      prompt: `You are a social media assistant helping a driver create a post about their journey.

  Based on the following information, generate a suitable caption and suggest an image for the post.

  Scene: ${input.scene}
  Mood: ${input.mood}
  Location: ${input.location}
  Weather: ${input.weather}
  Event: ${input.event}
`,
      history: [{role: 'user', content: [{media: {url: input.image, contentType: 'image/jpeg'}}]}],
      output: {
        schema: GenerateSocialMediaPostOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('No output from model');
    }
    return output;
  }
);

'use server';
/**
 * @fileOverview A flow to generate a trip itinerary based on natural language prompts.
 *
 * - generateItineraryFromPrompt - A function that generates a trip itinerary from a natural language prompt.
 * - GenerateItineraryFromPromptInput - The input type for the generateItineraryFromPrompt function.
 * - GenerateItineraryFromPromptOutput - The return type for the generateItineraryFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateItineraryFromPromptInputSchema = z.object({
  prompt: z
    .string()
    .describe(
      'A natural language prompt describing the desired trip itinerary.'
    ),
});
export type GenerateItineraryFromPromptInput = z.infer<
  typeof GenerateItineraryFromPromptInputSchema
>;

const GenerateItineraryFromPromptOutputSchema = z.object({
  itinerary: z.any().describe('The generated trip itinerary in JSON format.'),
});
export type GenerateItineraryFromPromptOutput = z.infer<
  typeof GenerateItineraryFromPromptOutputSchema
>;

export async function generateItineraryFromPrompt(
  input: GenerateItineraryFromPromptInput
): Promise<GenerateItineraryFromPromptOutput> {
  return generateItineraryFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItineraryFromPromptPrompt',
  input: {schema: GenerateItineraryFromPromptInputSchema},
  output: {schema: GenerateItineraryFromPromptOutputSchema},
  prompt: `You are a trip planning expert. Generate a detailed trip itinerary based on the following prompt:\n\n{{prompt}}\n\nEnsure the itinerary includes specific locations, activities, and estimated costs.  The itinerary must be valid JSON.`,
});

const generateItineraryFromPromptFlow = ai.defineFlow(
  {
    name: 'generateItineraryFromPromptFlow',
    inputSchema: GenerateItineraryFromPromptInputSchema,
    outputSchema: GenerateItineraryFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

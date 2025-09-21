'use server';

/**
 * @fileOverview Adjusts itinerary dynamically based on real-time factors and user feedback.
 *
 * - adjustItinerary - A function that adjusts the itinerary based on a text prompt.
 */

import {ai} from '@/ai/genkit';
import type {Itinerary, AdjustItineraryInput} from '@/lib/types';
import {AdjustItineraryInputSchema, ItineraryResponseSchema} from '@/lib/types';

const adjustItineraryPrompt = ai.definePrompt({
  name: 'adjustItineraryPrompt',
  input: {
    schema: AdjustItineraryInputSchema,
  },
  output: {
    schema: ItineraryResponseSchema,
  },
  prompt: `You are an AI travel assistant. Your task is to modify an existing trip itinerary based on user feedback.
The user's request for changes will be provided in a natural language prompt.
You MUST return a complete, valid JSON object that strictly adheres to the provided response schema, incorporating the requested changes. Preserve all existing data, including place IDs, latitude, and longitude, unless the modification explicitly changes a location. Do not include any extra text, commentary, or markdown formatting.

Here is the current itinerary that needs to be modified:
{{{currentItinerary}}}

Here is the user's request for changes:
"{{{modificationPrompt}}}"

Please apply the changes to the itinerary and return the full, updated itinerary object.
`,
});

const adjustItineraryFlow = ai.defineFlow(
  {
    name: 'adjustItineraryFlow',
    inputSchema: AdjustItineraryInputSchema,
    outputSchema: ItineraryResponseSchema,
  },
  async input => {
    const {output} = await adjustItineraryPrompt(input);
    if (!output) {
      throw new Error(
        'AI failed to generate a response that conforms to the schema.'
      );
    }
    return output;
  }
);

export async function adjustItinerary(
  input: AdjustItineraryInput
): Promise<Itinerary> {
  return await adjustItineraryFlow(input);
}

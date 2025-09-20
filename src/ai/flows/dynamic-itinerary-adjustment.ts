// src/ai/flows/dynamic-itinerary-adjustment.ts
'use server';

/**
 * @fileOverview Adjusts itinerary dynamically based on real-time factors.
 *
 * - adjustItinerary - A function that adjusts the itinerary.
 * - AdjustItineraryInput - The input type for the adjustItinerary function.
 * - AdjustItineraryOutput - The return type for the adjustItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustItineraryInputSchema = z.object({
  itinerary: z.string().describe('The itinerary in JSON format.'),
  weatherConditions: z.string().describe('Current weather conditions at the destination.'),
  riskAssessment: z.string().describe('Risk assessment for the planned activities.'),
  budgetStatus: z.string().describe('Current budget status of the trip.'),
});

export type AdjustItineraryInput = z.infer<typeof AdjustItineraryInputSchema>;

const AdjustItineraryOutputSchema = z.object({
  adjustedItinerary: z.string().describe('The adjusted itinerary in JSON format.'),
  summary: z.string().describe('A summary of the adjustments made.'),
});

export type AdjustItineraryOutput = z.infer<typeof AdjustItineraryOutputSchema>;

export async function adjustItinerary(input: AdjustItineraryInput): Promise<AdjustItineraryOutput> {
  return adjustItineraryFlow(input);
}

const adjustItineraryPrompt = ai.definePrompt({
  name: 'adjustItineraryPrompt',
  input: {
    schema: AdjustItineraryInputSchema,
  },
  output: {
    schema: AdjustItineraryOutputSchema,
  },
  prompt: `You are an AI travel assistant. Given the current itinerary, weather conditions, risk assessment, and budget status, suggest adjustments to the itinerary to make the trip safer, within budget, and more enjoyable. 

Itinerary: {{{itinerary}}}
Weather Conditions: {{{weatherConditions}}}
Risk Assessment: {{{riskAssessment}}}
Budget Status: {{{budgetStatus}}}

Provide the adjusted itinerary in JSON format and a summary of the adjustments made.
`,
});

const adjustItineraryFlow = ai.defineFlow(
  {
    name: 'adjustItineraryFlow',
    inputSchema: AdjustItineraryInputSchema,
    outputSchema: AdjustItineraryOutputSchema,
  },
  async input => {
    const {output} = await adjustItineraryPrompt(input);
    return output!;
  }
);

'use server';
/**
 * @fileOverview A flow to extract structured trip details from a natural language prompt.
 *
 * - extractTripDetails - A function that extracts trip details from a prompt.
 * - TripDetailsRequest - The input type for the extractTripDetails function.
 * - TripDetails - The return type for the extractTripDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TripDetailsRequestSchema = z.object({
  nl: z.string().describe('The free-text description from the user.'),
});
export type TripDetailsRequest = z.infer<typeof TripDetailsRequestSchema>;

const TripDetailsResponseSchema = z.object({
  city: z.string().optional(),
  start: z.string().describe('YYYY-MM-DD').optional(),
  end: z.string().describe('YYYY-MM-DD').optional(),
  budgetINR: z.number().optional(),
  party: z.object({
    adults: z.number().min(0),
    kids: z.number().min(0),
    seniors: z.number().min(0),
  }).optional(),
  modes: z.array(z.string()).describe('Subset of [flight,train,bus,cab,metro,bike]').optional(),
  themes: z.array(z.string()).describe('Any subset of [heritage,food,adventure,nightlife,shopping]').optional(),
  pace: z.enum(['relaxed', 'balanced', 'packed']).optional(),
  anchors: z.array(z.string()).optional(),
});
export type TripDetails = z.infer<typeof TripDetailsResponseSchema>;

export async function extractTripDetails(request: TripDetailsRequest): Promise<TripDetails> {
  return extractTripDetailsFlow(request);
}

const extractPrompt = ai.definePrompt({
  name: 'extractTripDetailsPrompt',
  input: { schema: TripDetailsRequestSchema },
  output: { schema: TripDetailsResponseSchema },
  prompt: `You are an expert trip planner. Extract the following details from the user's request: city, start date, end date, budget in INR, party composition (adults, kids, seniors), preferred modes of transport, travel themes, desired pace, and any must-visit places (anchors).

User Request: {{{nl}}}

Today's date is ${new Date().toISOString().split('T')[0]}. If dates are relative (e.g., "next weekend"), calculate the absolute dates.
If a duration is given (e.g., "4 days"), calculate the end date from the start date.
Return a JSON object matching the response schema.`,
});

const extractTripDetailsFlow = ai.defineFlow(
  {
    name: 'extractTripDetailsFlow',
    inputSchema: TripDetailsRequestSchema,
    outputSchema: TripDetailsResponseSchema,
  },
  async (request) => {
    const { output } = await extractPrompt(request);
    if (!output) {
      throw new Error("AI failed to extract trip details.");
    }
    return output;
  }
);

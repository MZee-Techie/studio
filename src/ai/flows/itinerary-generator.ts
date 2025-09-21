'use server';
/**
 * @fileOverview A comprehensive flow to generate a detailed trip itinerary.
 *
 * - generateItinerary - A function that generates a trip itinerary from a complex request object.
 * - ItineraryRequest - The input type for the generateItinerary function.
 * - Itinerary - The return type for the generateItinerary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the request schema based on the user's detailed specification
const ItineraryRequestSchema = z.object({
  nl: z.string().describe('The free-text description from the user.'),
  city: z.string(),
  start: z.string().describe('YYYY-MM-DD'),
  end: z.string().describe('YYYY-MM-DD'),
  budgetINR: z.number(),
  party: z.object({
    adults: z.number(),
    kids: z.number(),
    seniors: z.number(),
  }),
  modes: z.array(z.string()).describe('Subset of [flight,train,bus,cab,metro,bike]'),
  themes: z.array(z.string()).describe('Any subset of listed themes'),
  pace: z.enum(['relaxed', 'balanced', 'packed']),
  anchors: z.array(z.string()),
});
export type ItineraryRequest = z.infer<typeof ItineraryRequestSchema>;

// Define the response schema based on the user's detailed specification
const ItineraryResponseSchema = z.object({
  trip: z.object({
    city: z.string(),
    start: z.string().describe('YYYY-MM-DD'),
    end: z.string().describe('YYYY-MM-DD'),
    budget: z.number(),
    currency: z.enum(['INR']),
  }),
  party: z.array(z.object({
    age: z.number()
  })).optional(),
  days: z.array(
    z.object({
      date: z.string(),
      dayBudget: z.number().optional(),
      daySpendEst: z.number().optional(),
      segments: z.array(
        z.object({
          type: z.enum(['transport', 'activity', 'meal', 'free']),
          name: z.string().optional(),
          placeId: z.string().optional(),
          mode: z.string().describe('flight|train|bus|cab|metro|bike|walk').optional(),
          from: z.string().optional(),
          to: z.string().optional(),
          fromPlaceId: z.string().optional(),
          toPlaceId: z.string().optional(),
          dep: z.string().optional(),
          arr: z.string().optional(),
          window: z.tuple([z.string(), z.string()]).optional(),
          openHours: z.string().optional(),
          rating: z.number().optional(),
          estCost: z.number().optional(),
          risk: z.array(z.enum(['rain', 'heat', 'crowd', 'late-night', 'closure'])).optional(),
        })
      ),
    })
  ),
  totals: z.object({
    est: z.number(),
    perPerson: z.number().optional(),
  }),
  risks: z.array(z.object({
    kind: z.string(),
    date: z.string(),
    severity: z.string(),
    note: z.string(),
  })).optional(),
  packingList: z.array(z.string()),
  checklist: z.array(z.string()),
});
export type Itinerary = z.infer<typeof ItineraryResponseSchema>;

// The main exported function that calls the Genkit flow
export async function generateItinerary(request: ItineraryRequest): Promise<Itinerary> {
  return itineraryGeneratorFlow(request);
}

// Define the Genkit Prompt with the specified system instruction and schemas
const itineraryPrompt = ai.definePrompt({
  name: 'itineraryGeneratorPrompt',
  input: { schema: ItineraryRequestSchema },
  output: { schema: ItineraryResponseSchema },
  prompt: `You are an Indian trip-planning assistant. Respect the given dates, INR budget, ages, modes, themes, pace, and anchors. Build a feasible day-by-day plan with realistic durations, opening hours, ratings if known, and travel legs. Add risk tags from [‘rain’, ‘heat’, ‘crowd’, ‘late-night’, ‘closure’]. Include a packingList and a checklist. Return ONE JSON object exactly matching the response schema. No extra text.

User Request:
Natural Language Prompt: {{{nl}}}
City: {{{city}}}
Dates: {{{start}}} to {{{end}}}
Budget: {{{budgetINR}}} INR
Party: {{party.adults}} adults, {{party.kids}} kids, {{party.seniors}} seniors
Transport Modes: {{#each modes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Themes: {{#each themes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Pace: {{{pace}}}
Must-visit Anchors: {{#each anchors}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}`,
});

// Define the Genkit Flow
const itineraryGeneratorFlow = ai.defineFlow(
  {
    name: 'itineraryGeneratorFlow',
    inputSchema: ItineraryRequestSchema,
    outputSchema: ItineraryResponseSchema,
  },
  async (request) => {
    const { output } = await itineraryPrompt(request);
    if (!output) {
      throw new Error("AI failed to generate a response.");
    }
    return output;
  }
);

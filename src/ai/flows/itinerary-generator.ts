'use server';
/**
 * @fileOverview A comprehensive flow to generate a detailed trip itinerary.
 *
 * - generateItinerary - A function that generates a trip itinerary from a complex request object.
 */

import {ai} from '@/ai/genkit';
import type {Itinerary, ItineraryRequest} from '@/lib/types';
import {ItineraryRequestSchema, ItineraryResponseSchema} from '@/lib/types';

// Define the Genkit Prompt with the specified system instruction and schemas
const itineraryPrompt = ai.definePrompt({
  name: 'itineraryGeneratorPrompt',
  input: {schema: ItineraryRequestSchema},
  output: {schema: ItineraryResponseSchema},
  prompt: `You are an Indian trip-planning assistant. Your output MUST be a single JSON object that strictly adheres to the provided response schema. Do not include any extra text, commentary, or markdown formatting.

The user's request may involve multiple cities or destinations. Create a logical itinerary that may span across different locations day-by-day.
You must respect all constraints from the user's request: dates, INR budget, party composition (ages), transport modes, travel themes, pace, and must-visit anchors.

For each day, specify the city for that day's plan.
Build a feasible day-by-day plan. For each segment, you MUST provide a descriptive 'name'. For transport, this should be like "Flight to [City]" or "Train from [City A] to [City B]".
For each segment, provide a brief, engaging 'description' of the place or activity.
Include realistic durations, opening hours, Google ratings, Google Place IDs, latitude, and longitude where available.
Assign risk tags for each segment where applicable, choosing from: 'rain', 'heat', 'crowd', 'late-night', 'closure'.
Include a practical 'packingList' and a pre-travel 'checklist'.

User Request:
Start Point: {{{startPoint}}}
Destination: {{{destination}}}
Natural Language Prompt: {{{nl}}}
Dates: {{{start}}} to {{{end}}}
Budget: {{{budgetINR}}} INR
Party: Adults: {{party.adults}}, Kids: {{party.kids}}, Seniors: {{party.seniors}}
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
  async request => {
    const {output} = await itineraryPrompt(request);
    if (!output) {
      throw new Error(
        'AI failed to generate a response that conforms to the schema.'
      );
    }
    return output;
  }
);

// The main exported function that calls the Genkit flow
export async function generateItinerary(
  request: ItineraryRequest
): Promise<Itinerary> {
  return await itineraryGeneratorFlow(request);
}

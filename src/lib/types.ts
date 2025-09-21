import { z } from 'zod';

// Schema for the main itinerary generation request
export const ItineraryRequestSchema = z.object({
  nl: z.string().describe('The free-text description from the user, which may include multiple destinations.').optional(),
  startPoint: z.string().describe('The starting point of the journey.'),
  destination: z.string().describe('The main destination or final point of the journey.'),
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


// Schema for the AI's response, representing a full itinerary
export const ItineraryResponseSchema = z.object({
  trip: z.object({
    title: z.string().describe('A creative title for the trip, e.g., "Coastal Journey from Goa to Dandeli"'),
    cities: z.array(z.string()).describe('An array of all cities/destinations visited in the trip.'),
    start: z.string().describe('YYYY-MM-DD'),
    end: z.string().describe('YYYY-MM-DD'),
    budget: z.number(),
    currency: z.enum(['INR']),
  }),
  party: z.array(z.object({
    age: z.number(),
    gender: z.string().optional(),
    vibe: z.string().optional(),
  })).optional(),
  days: z.array(
    z.object({
      date: z.string(),
      city: z.string().describe("The primary city for this day's activities."),
      dayBudget: z.number().optional(),
      daySpendEst: z.number().optional(),
      segments: z.array(
        z.object({
          type: z.enum(['transport', 'activity', 'meal', 'free']),
          name: z.string().describe('A descriptive name for the segment. For transport, this should be like "Flight to [City]" or "Train from [City A] to [City B]". This field is required.'),
          description: z.string().describe('A brief, engaging description of the place or activity, highlighting what makes it special.').optional(),
          placeId: z.string().describe('The Google Maps Place ID, if available.').optional(),
          lat: z.number().optional().describe('Latitude of the location.'),
          lon: z.number().optional().describe('Longitude of the location.'),
          mode: z.string().describe('flight|train|bus|cab|metro|walk').optional(),
          from: z.string().optional(),
          to: z.string().optional(),
          fromPlaceId: z.string().optional(),
          toPlaceId: z.string().optional(),
          dep: z.string().optional(),
          arr: z.string().optional(),
          window: z.array(z.string()).length(2).optional(),
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


// Schema for the dynamic itinerary adjustment flow
export const AdjustItineraryInputSchema = z.object({
  currentItinerary: z.string().describe('The current itinerary in JSON format.'),
  modificationPrompt: z
    .string()
    .describe('A natural language prompt describing the desired changes.'),
});
export type AdjustItineraryInput = z.infer<typeof AdjustItineraryInputSchema>;
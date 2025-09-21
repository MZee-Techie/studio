import { config } from 'dotenv';
config();

// Keep existing flows if they are used elsewhere
import '@/ai/flows/prompt-based-itinerary-generation.ts';
import '@/ai/flows/dynamic-itinerary-adjustment.ts';

// Add the new comprehensive itinerary generator flow
import '@/ai/flows/itinerary-generator.ts';

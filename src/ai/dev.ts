'use server';
import {config} from 'dotenv';
config();

// Keep existing flows if they are used elsewhere
import '@/ai/flows/prompt-based-itinerary-generation.ts';
import '@/ai/flows/extract-trip-details.ts';
import '@/ai/flows/itinerary-generator.ts';

// Add the new flow for dynamically adjusting the itinerary
import '@/ai/flows/dynamic-itinerary-adjustment.ts';

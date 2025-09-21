// src/app/plan/result/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Home, Edit } from 'lucide-react';

interface Activity {
  time: string;
  description: string;
  cost: string;
}

interface DayPlan {
  day: number;
  theme: string;
  activities: Activity[];
}

interface Itinerary {
  tripName: string;
  duration: string;
  budget: string;
  days: DayPlan[];
}

export default function ResultPage() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedItinerary = localStorage.getItem('itineraryResult');
    if (storedItinerary) {
      try {
        const parsedItinerary = JSON.parse(storedItinerary);
        setItinerary(parsedItinerary);
      } catch (error) {
        console.error('Failed to parse itinerary from localStorage', error);
        router.push('/plan');
      }
    } else {
      // If no itinerary is found, redirect back to the planning page
      router.push('/plan');
    }
  }, [router]);

  if (!itinerary) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading itinerary...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-4xl">{itinerary.tripName}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {itinerary.duration} | Estimated Budget: {itinerary.budget}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4 mb-8">
            <Button onClick={() => router.push('/plan')}>
              <Edit className="mr-2 h-4 w-4" /> Edit Prompt
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              <Home className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {itinerary.days.map((day, index) => (
              <AccordionItem value={`item-${index}`} key={day.day}>
                <AccordionTrigger className="font-headline text-xl">
                  Day {day.day}: {day.theme}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-4">
                    {day.activities.map((activity, activityIndex) => (
                      <li key={activityIndex} className="flex flex-col p-4 bg-secondary/50 rounded-lg">
                        <span className="font-bold text-md">{activity.time}</span>
                        <p className="text-muted-foreground mt-1">{activity.description}</p>
                        <span className="text-sm font-semibold mt-2">Estimated Cost: {activity.cost}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowRight, Trash2 } from 'lucide-react';
import type { Itinerary } from '@/lib/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedItineraries = localStorage.getItem('savedItineraries');
    if (storedItineraries) {
      setSavedItineraries(JSON.parse(storedItineraries));
    }
  }, []);

  const handleDelete = (tripTitle: string) => {
    const updatedItineraries = savedItineraries.filter(i => i.trip.title !== tripTitle);
    setSavedItineraries(updatedItineraries);
    localStorage.setItem('savedItineraries', JSON.stringify(updatedItineraries));
  };

  const handleView = (tripTitle: string) => {
    router.push(`/plan/itinerary?tripId=${encodeURIComponent(tripTitle)}`);
  };

  return (
    <div className="min-h-screen bg-secondary/50">
      <header className="bg-background shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">My Dashboard</h1>
            <p className="text-muted-foreground">View and manage your saved trips.</p>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {savedItineraries.length === 0 ? (
          <Card className="text-center py-16">
            <CardHeader>
              <CardTitle>No Saved Trips Yet</CardTitle>
              <CardDescription>
                You haven't saved any itineraries. Start by planning a new trip!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/plan">Plan a New Trip</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedItineraries.map((itinerary, index) => (
              <Card key={index} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">{itinerary.trip.title}</CardTitle>
                  <CardDescription>
                    {format(new Date(itinerary.trip.start), 'do MMM')} - {format(new Date(itinerary.trip.end), 'do MMM, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground line-clamp-2">{itinerary.trip.cities.join(', ')}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(itinerary.trip.title)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" onClick={() => handleView(itinerary.trip.title)}>
                    View Itinerary <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

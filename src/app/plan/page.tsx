// src/app/plan/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { generateItineraryFromPrompt } from '@/ai/flows/prompt-based-itinerary-generation';

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: 'Prompt must be at least 10 characters.',
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function PlanPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      const result = await generateItineraryFromPrompt(data);
      // Store result in local storage to be picked up by the results page
      localStorage.setItem('itineraryResult', JSON.stringify(result.itinerary));
      router.push('/plan/result');
    } catch (error) {
      console.error('Error generating itinerary:', error);
      // Handle error (e.g., show a toast message)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Plan Your Dream Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Describe your ideal vacation in the text box below. Be as specific or as general as you like. Our AI will craft a personalized itinerary just for you.
          </p>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Travel Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'A 7-day romantic getaway to Paris for two, focusing on art museums, local cuisine, and historical landmarks. Budget is around $3000.'"
                        {...field}
                        rows={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Generating Itinerary...' : 'Generate Itinerary'}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}

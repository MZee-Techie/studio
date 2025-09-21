// src/app/plan/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Languages, Loader2, Plane, Train, Bus, Car, TramFront, Bike, Utensils, Landmark, Mountain, Beer, ShoppingBag, Sparkles } from 'lucide-react';
import { generateItinerary } from '@/ai/flows/itinerary-generator';
import type { ItineraryRequest } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  nl: z.string().min(10, "Please describe your desired trip in a bit more detail."),
  startPoint: z.string().min(1, "Start point is required."),
  destination: z.string().min(1, "Destination is required."),
  start: z.date({ required_error: "Start date is required." }),
  end: z.date({ required_error: "End date is required." }),
  budgetINR: z.number().min(0, "Budget must be a positive number."),
  party: z.object({
    adults: z.number().min(0),
    kids: z.number().min(0),
    seniors: z.number().min(0),
  }),
  modes: z.array(z.string()),
  themes: z.array(z.string()),
  pace: z.enum(['relaxed', 'balanced', 'packed']),
  anchors: z.array(z.string()),
});

type FormData = z.infer<typeof formSchema>;

const modeOptions = [
  { id: 'flight', label: 'Flight', icon: <Plane className="w-5 h-5"/> },
  { id: 'train', label: 'Train', icon: <Train className="w-5 h-5"/> },
  { id: 'bus', label: 'Bus', icon: <Bus className="w-5 h-5"/> },
  { id: 'cab', label: 'Cab', icon: <Car className="w-5 h-5"/> },
  { id: 'metro', label: 'Metro', icon: <TramFront className="w-5 h-5"/> },
  { id: 'bike', label: 'Bike', icon: <Bike className="w-5 h-5"/> },
];

const themeOptions = [
  { id: 'heritage', label: 'Heritage', icon: <Landmark className="w-5 h-5"/> },
  { id: 'food', label: 'Food', icon: <Utensils className="w-5 h-5"/> },
  { id: 'adventure', label: 'Adventure', icon: <Mountain className="w-5 h-5"/> },
  { id: 'nightlife', label: 'Nightlife', icon: <Beer className="w-5 h-5"/> },
  { id: 'shopping', label: 'Shopping', icon: <ShoppingBag className="w-5 h-5"/> },
];

const translations = {
  en: {
    title: "Plan Your Next Adventure",
    subTitle: "Describe your ideal trip, and let our AI craft the perfect itinerary for you.",
    demo: "Demo",
    describeTrip: "Describe your trip in detail",
    examplePrompt: "e.g., A 4-day relaxed trip to Jaipur and Udaipur for 2 adults. We love palaces and street food. Our budget is around ₹40,000. We'll travel by train between cities.",
    details: "Trip Details",
    startPoint: "Starting From",
    destination: "Main Destination(s)",
    startDate: "Start Date",
    endDate: "End Date",
    budget: "Budget (₹)",
    party: "Travel Party",
    adults: "Adults",
    kids: "Kids (0-12)",
    seniors: "Seniors (60+)",
    modes: "Preferred Transport",
    themes: "Interests & Themes",
    pace: "Pace",
    relaxed: "Relaxed",
    balanced: "Balanced",
    packed: "Packed",
    anchors: "Must-Visit Places (optional, comma-separated)",
    anchorsPlaceholder: "e.g., Hawa Mahal, Lake Pichola",
    generate: "Generate Itinerary",
    generating: "Please wait while we Ease your Journey...",
    errorToastTitle: "Generation Failed",
    errorToastDescription: "The itinerary could not be generated. Please try adjusting your prompt or details.",
  },
  hi: {
    title: "अपनी अगली यात्रा की योजना बनाएं",
    subTitle: "अपनी आदर्श यात्रा का वर्णन करें, और हमारे AI को आपके लिए सही यात्रा कार्यक्रम तैयार करने दें।",
    demo: "डेमो",
    describeTrip: "अपनी यात्रा का विस्तार से वर्णन करें",
    examplePrompt: "जैसे, 2 वयस्कों के लिए जयपुर और उदयपुर की 4-दिवसीय आरामदायक यात्रा। हमें महल और स्ट्रीट फूड पसंद हैं। हमारा बजट लगभग ₹40,000 है। हम शहरों के बीच ट्रेन से यात्रा करेंगे।",
    details: "यात्रा विवरण",
    startPoint: "प्रारंभ बिंदु",
    destination: "मुख्य गंतव्य",
    startDate: "प्रारंभ तिथि",
    endDate: "अंतिम तिथि",
    budget: "बजट (₹)",
    party: "यात्रा समूह",
    adults: "वयस्क",
    kids: "बच्चे (0-12)",
    seniors: "वरिष्ठ (60+)",
    modes: "पसंदीदा परिवहन",
    themes: "रुचियां और थीम",
    pace: "गति",
    relaxed: "आरामदायक",
    balanced: "संतुलित",
    packed: "व्यस्त",
anchors: "जरूर घूमने की जगहें (वैकल्पिक, अल्पविराम से अलग)",
    anchorsPlaceholder: "जैसे, हवा महल, पिछोला झील",
    generate: "यात्रा कार्यक्रम बनाएं",
    generating: "आपकी यात्रा तैयार की जा रही है...",
    errorToastTitle: "निर्माण विफल",
    errorToastDescription: "यात्रा कार्यक्रम उत्पन्न नहीं किया जा सका। कृपया अपना प्रॉम्प्ट या विवरण समायोजित करने का प्रयास करें।",
  }
};

const Chip = ({ label, icon, isSelected, ...props }: { label: string, icon: React.ReactNode, isSelected: boolean } & React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-full border-2 cursor-pointer transition-all duration-200",
      isSelected ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-card hover:bg-secondary/80 hover:border-primary/50"
    )}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default function PlanPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const { toast } = useToast();
  const router = useRouter();
  const t = translations[lang];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nl: '',
      startPoint: '',
      destination: '',
      budgetINR: 30000,
      party: { adults: 2, kids: 0, seniors: 0 },
      modes: ['train', 'cab'],
      themes: ['heritage', 'food'],
      pace: 'balanced',
      anchors: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
       const anchors = Array.isArray(data.anchors)
        ? data.anchors.filter(a => a.trim() !== '')
        : (data.anchors ? String(data.anchors).split(',').map(s => s.trim()).filter(Boolean) : []);


      const request: ItineraryRequest = {
        ...data,
        anchors,
        start: format(data.start, 'yyyy-MM-dd'),
        end: format(data.end, 'yyyy-MM-dd'),
        party: {
          adults: Number(data.party.adults) || 0,
          kids: Number(data.party.kids) || 0,
          seniors: Number(data.party.seniors) || 0,
        }
      };
      
      const result = await generateItinerary(request);
      
      if (result && result.trip && result.trip.cities && Array.isArray(result.days) && result.totals) {
        sessionStorage.setItem('itinerary', JSON.stringify(result));
        router.push('/plan/itinerary');
      } else {
        console.error("Invalid itinerary format received from AI:", result);
        throw new Error("Invalid itinerary format");
      }

    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast({
        variant: "destructive",
        title: t.errorToastTitle,
        description: (error as Error).message || t.errorToastDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/50">
       <header className="bg-background shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
           <div>
            <h1 className="text-3xl font-bold font-headline">{t.title}</h1>
            <p className="text-muted-foreground">{t.subTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>
              <Languages />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">{t.details}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="startPoint" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.startPoint}</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g., Mumbai" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="destination" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.destination}</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g., Goa, Jaipur" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="start" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t.startDate}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="end" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t.endDate}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <div>
                    <FormLabel>{t.party}</FormLabel>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                       <FormField control={form.control} name="party.adults" render={({ field }) => (
                        <FormItem><FormLabel className="font-normal text-sm">{t.adults}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl></FormItem>
                      )} />
                       <FormField control={form.control} name="party.kids" render={({ field }) => (
                        <FormItem><FormLabel className="font-normal text-sm">{t.kids}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl></FormItem>
                      )} />
                       <FormField control={form.control} name="party.seniors" render={({ field }) => (
                        <FormItem><FormLabel className="font-normal text-sm">{t.seniors}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl></FormItem>
                      )} />
                    </div>
                  </div>

                   <FormField control={form.control} name="budgetINR" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.budget}</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField
                    control={form.control}
                    name="modes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.modes}</FormLabel>
                        <div className="flex flex-wrap gap-3 pt-2">
                          {modeOptions.map(option => (
                            <Chip
                              key={option.id}
                              label={option.label}
                              icon={option.icon}
                              isSelected={field.value.includes(option.id)}
                              onClick={() => {
                                const newValue = field.value.includes(option.id)
                                  ? field.value.filter(item => item !== option.id)
                                  : [...field.value, option.id];
                                field.onChange(newValue);
                              }}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="themes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.themes}</FormLabel>
                        <div className="flex flex-wrap gap-3 pt-2">
                          {themeOptions.map(option => (
                            <Chip
                              key={option.id}
                              label={option.label}
                              icon={option.icon}
                              isSelected={field.value.includes(option.id)}
                              onClick={() => {
                                const newValue = field.value.includes(option.id)
                                  ? field.value.filter(item => item !== option.id)
                                  : [...field.value, option.id];
                                field.onChange(newValue);
                              }}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.pace}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pace" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="relaxed">{t.relaxed}</SelectItem>
                            <SelectItem value="balanced">{t.balanced}</SelectItem>
                            <SelectItem value="packed">{t.packed}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="anchors" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.anchors}</FormLabel>
                      <FormControl><Input value={Array.isArray(field.value) ? field.value.join(', ') : ''} placeholder={t.anchorsPlaceholder} onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()))} /></FormControl>
                    </FormItem>
                  )} />

                  <FormField
                    control={form.control}
                    name="nl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">{t.describeTrip}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} placeholder={t.examplePrompt} className="text-base"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </CardContent>
              </Card>

              <div className="flex flex-col gap-2">
                 <Button type="submit" size="lg" className="w-full h-14 text-xl font-bold shadow-lg" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2"/>}
                    {isLoading ? t.generating : t.generate}
                  </Button>
              </div>

            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}

    
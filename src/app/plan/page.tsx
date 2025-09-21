// src/app/plan/page.tsx
'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Download, Languages, Loader2, Plane, Train, Bus, Car, TramFront, Bike, Utensils, Landmark, Mountain, Beer, ShoppingBag, Wind, CloudRain, Sun, Users, IndianRupee, Grip } from 'lucide-react';
import { generateItinerary } from '@/ai/flows/itinerary-generator';
import { Itinerary, ItineraryRequest } from '@/ai/flows/itinerary-generator';
import { extractTripDetails } from '@/ai/flows/extract-trip-details';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';


const formSchema = z.object({
  nl: z.string().min(10, "Please describe your trip in at least 10 characters."),
  city: z.string().min(1, "City is required."),
  start: z.date({ required_error: "Start date is required." }),
  end: z.date({ required_error: "End date is required." }),
  budgetINR: z.number().min(0),
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
  { id: 'flight', label: 'Flight', icon: <Plane /> },
  { id: 'train', label: 'Train', icon: <Train /> },
  { id: 'bus', label: 'Bus', icon: <Bus /> },
  { id: 'cab', label: 'Cab', icon: <Car /> },
  { id: 'metro', label: 'Metro', icon: <TramFront /> },
  { id: 'bike', label: 'Bike', icon: <Bike /> },
];

const themeOptions = [
  { id: 'heritage', label: 'Heritage', icon: <Landmark /> },
  { id: 'food', label: 'Food', icon: <Utensils /> },
  { id: 'adventure', label: 'Adventure', icon: <Mountain /> },
  { id: 'nightlife', label: 'Nightlife', icon: <Beer /> },
  { id: 'shopping', label: 'Shopping', icon: <ShoppingBag /> },
];

const translations = {
  en: {
    title: "Itinerary Generator",
    demo: "Demo",
    download: "Download",
    downloadJson: "JSON",
    downloadIcs: "ICS",
    describeTrip: "Describe your trip in plain English…",
    examplePrompt: "e.g., 4 relaxed days in Jaipur for 2 adults + 1 kid, ₹30k total, prefer trains and street food, must visit Hawa Mahal.",
    combineNote: "We’ll combine this with the details below.",
    details: "Details",
    city: "City",
    startDate: "Start Date",
    endDate: "End Date",
    budget: "Budget (INR)",
    party: "Party",
    adults: "Adults",
    kids: "Kids",
    seniors: "Seniors",
    modes: "Modes",
    themes: "Themes",
    pace: "Pace",
    relaxed: "Relaxed",
    balanced: "Balanced",
    packed: "Packed",
    anchors: "Anchors (comma-separated)",
    anchorsPlaceholder: "Hawa Mahal, City Palace",
    generate: "Generate Itinerary",
    regenerate: "Regenerate with changes",
    generating: "Generating...",
    itineraryView: "Itinerary",
    liveChecks: "Live Checks",
    budgetStatus: "Budget Status",
    weather: "Weather",
    packingList: "Packing List",
    checklist: "Checklist",
    day: "Day",
    validationError: "Please fill out City, Dates, and Budget.",
    errorToastTitle: "Generation Failed",
    errorToastDescription: "The itinerary format was invalid. Please try regenerating.",
    parsingPrompt: "Extracting details...",
    emptyState: "Your generated itinerary will appear here. Describe your trip and click 'Generate' to start!",
  },
  hi: {
    title: "यात्रा कार्यक्रम जेनरेटर",
    demo: "डेमो",
    download: "डाउनलोड",
    downloadJson: "JSON",
    downloadIcs: "ICS",
    describeTrip: "अपनी यात्रा का सरल अंग्रेजी में वर्णन करें...",
    examplePrompt: "जैसे, 2 वयस्कों + 1 बच्चे के लिए जयपुर में 4 आरामदायक दिन, कुल ₹30k, ट्रेनों और स्ट्रीट फूड को प्राथमिकता दें, हवा महल जरूर जाएं।",
    combineNote: "हम इसे नीचे दिए गए विवरणों के साथ जोड़ेंगे।",
    details: "विवरण",
    city: "शहर",
    startDate: "प्रारंभ तिथि",
    endDate: "अंतिम तिथि",
    budget: "बजट (INR)",
    party: "समूह",
    adults: "वयस्क",
    kids: "बच्चे",
    seniors: "वरिष्ठ",
    modes: "माध्यम",
    themes: "थीम",
    pace: "गति",
    relaxed: "आरामदायक",
    balanced: "संतुलित",
    packed: "व्यस्त",
    anchors: "मुख्य आकर्षण (अल्पविराम से अलग)",
    anchorsPlaceholder: "हवा महल, सिटी पैलेस",
    generate: "यात्रा कार्यक्रम बनाएं",
    regenerate: "बदलावों के साथ फिर से बनाएं",
    generating: "बना रहा है...",
    itineraryView: "यात्रा कार्यक्रम",
    liveChecks: "लाइव जांच",
    budgetStatus: "बजट स्थिति",
    weather: "मौसम",
    packingList: "पैकिंग सूची",
    checklist: "जांच सूची",
    day: "दिन",
    validationError: "कृपया शहर, तिथियां और बजट भरें।",
    errorToastTitle: "निर्माण विफल",
    errorToastDescription: "यात्रा कार्यक्रम का प्रारूप अमान्य था। कृपया फिर से बनाने का प्रयास करें।",
    parsingPrompt: "विवरण निकाले जा रहे हैं...",
    emptyState: "आपका बनाया गया यात्रा कार्यक्रम यहां दिखाई देगा। अपनी यात्रा का वर्णन करें और शुरू करने के लिए 'बनाएं' पर क्लिक करें!",
  }
};

const Chip = ({ label, icon, isSelected, ...props }: { label: string, icon: React.ReactNode, isSelected: boolean } & React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors",
      isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-secondary hover:bg-secondary/80"
    )}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default function PlanPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const { toast } = useToast();
  const t = translations[lang];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nl: '',
      city: '',
      budgetINR: 30000,
      party: { adults: 2, kids: 0, seniors: 0 },
      modes: ['train', 'cab'],
      themes: ['heritage', 'food'],
      pace: 'balanced',
      anchors: [],
    },
  });

  const handlePromptBlur = async () => {
    const nl = form.getValues('nl');
    if (nl.length < 10) return;

    setIsParsing(true);
    try {
      const details = await extractTripDetails({ nl });
      if (details.city) form.setValue('city', details.city);
      if (details.start) form.setValue('start', new Date(details.start));
      if (details.end) form.setValue('end', new Date(details.end));
      if (details.budgetINR) form.setValue('budgetINR', details.budgetINR);
      if (details.party) form.setValue('party', details.party);
      if (details.modes) form.setValue('modes', details.modes.filter(m => modeOptions.some(o => o.id === m)));
      if (details.themes) form.setValue('themes', details.themes.filter(th => themeOptions.some(o => o.id === th)));
      if (details.pace) form.setValue('pace', details.pace);
      if (details.anchors) form.setValue('anchors', details.anchors);
    } catch (error) {
      console.error("Error extracting details:", error);
      toast({
        variant: "destructive",
        title: "Parsing Error",
        description: "Could not extract details from the prompt. Please fill the form manually.",
      });
    } finally {
      setIsParsing(false);
    }
  };


  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setItinerary(null);
    try {
      const request: ItineraryRequest = {
        ...data,
        start: format(data.start, 'yyyy-MM-dd'),
        end: format(data.end, 'yyyy-MM-dd'),
      };
      const result = await generateItinerary(request);
      // Basic validation for the response schema
      if (result && result.trip && result.days && result.totals) {
        setItinerary(result);
      } else {
        throw new Error("Invalid itinerary format");
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast({
        variant: "destructive",
        title: t.errorToastTitle,
        description: t.errorToastDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleJsonDownload = () => {
    if (!itinerary) return;
    const fileName = `trip-${itinerary.trip.city}-${itinerary.trip.start}.json`;
    downloadFile(JSON.stringify(itinerary, null, 2), fileName, 'application/json');
  };

  const handleIcsDownload = () => {
    if (!itinerary || !itinerary.days) return;

    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//EasedYourTrip//NONSGML v1.0//EN\n';

    itinerary.days.forEach(day => {
      day.segments.forEach(segment => {
        const dtstart = day.date.replace(/-/g, '') + 'T' + (segment.dep || segment.window?.[0] || '0900').replace(/:/g, '') + '00';
        const dtend = day.date.replace(/-/g, '') + 'T' + (segment.arr || segment.window?.[1] || '1000').replace(/:/g, '') + '00';
        const summary = segment.type === 'transport' ? `${segment.mode} from ${segment.from} to ${segment.to}` : segment.name;

        icsContent += 'BEGIN:VEVENT\n';
        icsContent += `DTSTART:${dtstart}\n`;
        icsContent += `DTEND:${dtend}\n`;
        icsContent += `SUMMARY:${summary || 'Event'}\n`;
        if (segment.to) icsContent += `LOCATION:${segment.to}\n`;
        icsContent += 'END:VEVENT\n';
      });
    });

    icsContent += 'END:VCALENDAR';
    const fileName = `trip-${itinerary.trip.city}-${itinerary.trip.start}.ics`;
    downloadFile(icsContent, fileName, 'text/calendar');
  };

  const renderSegmentCard = (segment: any, day: any, segIndex: number) => {
    const commonProps = {
        key: segIndex,
        className: "p-4 rounded-lg bg-card border transition-transform hover:scale-[1.02] relative",
    };
    
    const riskIcons = {
        rain: <CloudRain className="w-4 h-4 text-blue-500" />,
        heat: <Sun className="w-4 h-4 text-orange-500" />,
        crowd: <Users className="w-4 h-4 text-yellow-500" />,
        'late-night': <Beer className="w-4 h-4 text-purple-500" />,
        closure: <Grip className="w-4 h-4 text-red-500" />,
    };

    return (
        <div {...commonProps}>
            <div className="flex justify-between items-start">
                <div>
                    <Badge variant="secondary" className="capitalize mb-2">{segment.type}</Badge>
                    <h4 className="font-bold text-lg">{segment.name || `${segment.from} → ${segment.to}`}</h4>
                </div>
                <div className="text-right shrink-0 ml-4">
                    <p className="font-semibold text-lg">{segment.estCost ? `₹${segment.estCost}` : ''}</p>
                    <p className="text-sm text-muted-foreground">{segment.dep && segment.arr ? `${segment.dep} - ${segment.arr}` : segment.window?.join(' - ')}</p>
                </div>
            </div>
            
            {(segment.risk?.length > 0 || segment.rating) && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                      {segment.risk?.map((r: keyof typeof riskIcons) => (
                           <Badge key={r} variant="outline" className="flex items-center gap-1">
                              {riskIcons[r]} {r}
                           </Badge>
                      ))}
                  </div>
                  {segment.rating && <Badge>{`★ ${segment.rating}`}</Badge>}
              </div>
            )}
        </div>
    );
};


  return (
    <FormProvider {...form}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <h1 className="text-2xl font-bold font-headline">{t.title} <Badge variant="outline">{t.demo}</Badge></h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>
                <Languages />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!itinerary}>
                    <Download className="mr-2" /> {t.download}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleJsonDownload}>{t.downloadJson}</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleIcsDownload}>{t.downloadIcs}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.describeTrip}</CardTitle>
                  <CardDescription>{t.examplePrompt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="nl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Textarea {...field} rows={5} onBlur={handlePromptBlur} />
                            {isParsing && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="animate-spin mr-2"/> {t.parsingPrompt}</div>}
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground pt-2">{t.combineNote}</p>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.details}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.city}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
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
                  
                  <FormField name="budgetINR" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.budget}</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div>
                    <FormLabel>{t.party}</FormLabel>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                       <FormField name="party.adults" render={({ field }) => (
                        <FormItem><FormLabel className="font-normal">{t.adults}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl></FormItem>
                      )} />
                       <FormField name="party.kids" render={({ field }) => (
                        <FormItem><FormLabel className="font-normal">{t.kids}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl></FormItem>
                      )} />
                       <FormField name="party.seniors" render={({ field }) => (
                        <FormItem><FormLabel className="font-normal">{t.seniors}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl></FormItem>
                      )} />
                    </div>
                  </div>

                  <FormField
                    name="modes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.modes}</FormLabel>
                        <div className="flex flex-wrap gap-2">
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
                    name="themes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.themes}</FormLabel>
                        <div className="flex flex-wrap gap-2">
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
                  <FormField name="anchors" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.anchors}</FormLabel>
                      <FormControl><Input value={Array.isArray(field.value) ? field.value.join(', ') : ''} placeholder={t.anchorsPlaceholder} onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()))} /></FormControl>
                    </FormItem>
                  )} />

                </CardContent>
              </Card>

              <div className="flex flex-col gap-2">
                 <Button type="submit" size="lg" className="w-full" disabled={isLoading || isParsing}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                    {isLoading ? t.generating : (itinerary ? t.regenerate : t.generate)}
                  </Button>
              </div>

            </form>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 font-headline">{t.itineraryView}</h2>
            
            {isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}><CardHeader><CardTitle className="h-8 bg-muted rounded-md animate-pulse"></CardTitle></CardHeader><CardContent className="space-y-4">
                    <div className="h-16 bg-muted rounded-md animate-pulse"></div>
                    <div className="h-16 bg-muted rounded-md animate-pulse"></div>
                  </CardContent></Card>
                ))}
              </div>
            )}
            
            {!isLoading && !itinerary && (
                <Card className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground text-center p-8">{t.emptyState}</p>
                </Card>
            )}

            {!isLoading && itinerary && (
              <div className="flex flex-col-reverse lg:flex-col lg:flex-row gap-8">
                <div className="flex-grow">
                  <Tabs defaultValue="day-0" className="w-full">
                    <TabsList>
                      {itinerary.days.map((day, index) => (
                        <TabsTrigger key={index} value={`day-${index}`}>{t.day} {index + 1}</TabsTrigger>
                      ))}
                    </TabsList>
                    {itinerary.days.map((day, index) => (
                      <TabsContent key={index} value={`day-${index}`}>
                        <div className="relative pt-4">
                          <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-border -z-10"></div>
                          <div className="space-y-6">
                            {day.segments.map((segment, segIndex) => renderSegmentCard(segment, day, segIndex))}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                <aside className="lg:w-80 lg:shrink-0 space-y-6">
                  <Card>
                    <CardHeader><CardTitle>{t.liveChecks}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                          <FormLabel>{t.budgetStatus}</FormLabel>
                          <Progress value={(itinerary.totals.est / itinerary.trip.budget) * 100} className="mt-2" />
                          <p className="text-sm text-muted-foreground mt-1">₹{itinerary.totals.est.toLocaleString()} / ₹{itinerary.trip.budget.toLocaleString()}</p>
                        </div>
                        {itinerary.risks && itinerary.risks.length > 0 && <div>
                          <FormLabel>{t.weather}</FormLabel>
                           <div className="flex flex-wrap gap-2 mt-2">
                              {itinerary.risks.filter(r => r.kind === 'rain' || r.kind === 'heat').map((risk, i) => (
                                <Badge key={i} variant="outline">{risk.severity} {risk.kind} on {new Date(risk.date).toLocaleDateString('en-US', {weekday: 'short'})}</Badge>
                              ))}
                           </div>
                        </div>}
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader><CardTitle>{t.packingList}</CardTitle></CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {itinerary.packingList?.map((item, i) => (
                        <Badge key={i} variant="secondary">{item}</Badge>
                      ))}
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader><CardTitle>{t.checklist}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                       {itinerary.checklist?.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Checkbox id={`checklist-${i}`} />
                          <label htmlFor={`checklist-${i}`} className="text-sm">{item}</label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </aside>
              </div>
            )}
          </div>
        </main>
      </div>
    </FormProvider>
  );
}

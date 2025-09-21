// src/app/plan/page.tsx
'use client';

import { useState, useRef } from 'react';
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
import { CalendarIcon, Download, Languages, Loader2, Plane, Train, Bus, Car, TramFront, Bike, Utensils, Landmark, Mountain, Beer, ShoppingBag, Wind, CloudRain, Sun, Users, IndianRupee, Grip, FileText, Send } from 'lucide-react';
import { generateItinerary } from '@/ai/flows/itinerary-generator';
import type { Itinerary, ItineraryRequest } from '@/lib/types';
import { adjustItinerary } from '@/ai/flows/dynamic-itinerary-adjustment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formSchema = z.object({
  nl: z.string().optional(),
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
    downloadPDF: "Download PDF",
    describeTrip: "Describe your trip (optional)",
    examplePrompt: "e.g., A 2-day trip. Day 1 in Goa with beach hopping. Day 2 in Dandeli for water sports.",
    details: "Plan Your Trip",
    startPoint: "Start Point",
    destination: "Destination",
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
    anchors: "Must-Visit Places (comma-separated)",
    anchorsPlaceholder: "Hawa Mahal, Baga Beach",
    generate: "Generate Itinerary",
    regenerate: "Regenerate with changes",
    generating: "Generating...",
    adjusting: "Adjusting...",
    itineraryView: "Your Custom Itinerary",
    liveChecks: "Live Checks",
    budgetStatus: "Budget Status",
    weather: "Weather",
    packingList: "Packing List",
    checklist: "Checklist",
    day: "Day",
    feedbackPrompt: "What changes would you like to make?",
    feedbackPlaceholder: "e.g., 'Make day 2 more relaxed' or 'Add a museum visit'",
    adjustItinerary: "Adjust Itinerary",
    validationError: "Please fill out all required fields.",
    errorToastTitle: "Generation Failed",
    adjustmentErrorToastTitle: "Adjustment Failed",
    errorToastDescription: "The itinerary could not be generated. Please try adjusting your prompt or details.",
    adjustmentErrorToastDescription: "The itinerary could not be adjusted. Please try a different request.",
    emptyState: "Your generated itinerary will appear here. Describe your trip and click 'Generate' to start!",
  },
  hi: {
    title: "यात्रा कार्यक्रम जेनरेटर",
    demo: "डेमो",
    downloadPDF: "पीडीएफ डाउनलोड करें",
    describeTrip: "अपनी यात्रा का वर्णन करें (वैकल्पिक)",
    examplePrompt: "जैसे, 2 दिन की यात्रा। दिन 1 गोवा में समुद्र तट पर घूमना। दिन 2 दांदेली में वाटर स्पोर्ट्स के लिए।",
    details: "अपनी यात्रा की योजना बनाएं",
    startPoint: "प्रारंभ बिंदु",
    destination: "गंतव्य",
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
    anchors: "जरूर घूमने की जगहें (अल्पविराम से अलग)",
    anchorsPlaceholder: "हवा महल, बागा बीच",
    generate: "यात्रा कार्यक्रम बनाएं",
    regenerate: "बदलावों के साथ फिर से बनाएं",
    generating: "बना रहा है...",
    adjusting: "समायोजित कर रहा है...",
    itineraryView: "आपकी कस्टम यात्रा कार्यक्रम",
    liveChecks: "लाइव जांच",
    budgetStatus: "बजट स्थिति",
    weather: "मौसम",
    packingList: "पैकिंग सूची",
    checklist: "जांच सूची",
    day: "दिन",
    feedbackPrompt: "आप क्या बदलाव करना चाहेंगे?",
    feedbackPlaceholder: "जैसे, 'दिन 2 को और आरामदायक बनाएं' या 'एक संग्रहालय यात्रा जोड़ें'",
    adjustItinerary: "यात्रा कार्यक्रम समायोजित करें",
    validationError: "कृपया सभी आवश्यक फ़ील्ड भरें।",
    errorToastTitle: "निर्माण विफल",
    adjustmentErrorToastTitle: "समायोजन विफल",
    errorToastDescription: "यात्रा कार्यक्रम उत्पन्न नहीं किया जा सका। कृपया अपना प्रॉम्प्ट या विवरण समायोजित करने का प्रयास करें।",
    adjustmentErrorToastDescription: "यात्रा कार्यक्रम समायोजित नहीं किया जा सका। कृपया एक अलग अनुरोध का प्रयास करें।",
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
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [modificationPrompt, setModificationPrompt] = useState("");
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const { toast } = useToast();
  const t = translations[lang];
  const itineraryRef = useRef<HTMLDivElement>(null);

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

  const handlePdfDownload = () => {
    const input = itineraryRef.current;
    if (!input || !itinerary) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    let y = margin;

    const addText = (text: string, x: number, y: number, options?: any) => {
        const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
        pdf.text(lines, x, y, options);
        return y + (lines.length * (options?.fontSize || 10) * 0.35);
    };

    y = addText(itinerary.trip.title, pageWidth / 2, y, { fontSize: 22, align: 'center' });
    y += 5;
    
    y = addText(`Trip to ${itinerary.trip.cities.join(', ')} from ${itinerary.trip.start} to ${itinerary.trip.end}`, margin, y, { fontSize: 12 });
    y = addText(`Budget: ₹${itinerary.trip.budget.toLocaleString()}`, margin, y, { fontSize: 12 });
    y += 10;
    
    itinerary.days.forEach((day, dayIndex) => {
      if (y > pageHeight - 30) {
        pdf.addPage();
        y = margin;
      }
      y = addText(`Day ${dayIndex + 1}: ${day.city} (${day.date})`, margin, y, { fontSize: 16 });
      y += 2;
      
      day.segments.forEach(segment => {
         if (y > pageHeight - 20) {
          pdf.addPage();
          y = margin;
        }
        y = addText(`${segment.name || `${segment.from} to ${segment.to}`}`, margin + 5, y, { fontSize: 12, fontStyle: 'bold' });
        
        let details = `Type: ${segment.type}`;
        if(segment.window) details += ` | Time: ${segment.window.join(' - ')}`;
        if(segment.estCost) details += ` | Cost: ₹${segment.estCost}`;

        y = addText(details, margin + 5, y, { fontSize: 10 });
        y += 5;
      });
      y += 5;
    });

    const fileName = `trip-${itinerary.trip.cities.join('-')}-${itinerary.trip.start}.pdf`;
    pdf.save(fileName);
  };
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setItinerary(null);
    try {
      const anchors = Array.isArray(data.anchors) ? data.anchors : (data.anchors ? String(data.anchors).split(',').map(s => s.trim()) : []);

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
        setItinerary(result);
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

  const handleAdjustItinerary = async () => {
    if (!itinerary || !modificationPrompt) return;

    setIsAdjusting(true);
    try {
      const result = await adjustItinerary({
        currentItinerary: JSON.stringify(itinerary),
        modificationPrompt: modificationPrompt,
      });

      if (result && result.trip && result.trip.cities && Array.isArray(result.days) && result.totals) {
        setItinerary(result);
        setModificationPrompt(""); // Clear prompt on success
      } else {
        console.error("Invalid adjusted itinerary format received from AI:", result);
        throw new Error("Invalid itinerary format");
      }
    } catch (error) {
       console.error('Error adjusting itinerary:', error);
       toast({
        variant: "destructive",
        title: t.adjustmentErrorToastTitle,
        description: (error as Error).message || t.adjustmentErrorToastDescription,
      });
    } finally {
      setIsAdjusting(false);
    }
  }

  const renderSegmentCard = (segment: any, segIndex: number) => {
    const riskIcons = {
        rain: <CloudRain className="w-4 h-4 text-blue-500" />,
        heat: <Sun className="w-4 h-4 text-orange-500" />,
        crowd: <Users className="w-4 h-4 text-yellow-500" />,
        'late-night': <Beer className="w-4 h-4 text-purple-500" />,
        closure: <Grip className="w-4 h-4 text-red-500" />,
    };

    return (
        <div key={segIndex} className="p-4 rounded-lg bg-card border transition-transform hover:scale-[1.02] relative ml-8">
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
                      {segment.risk?.map((r: keyof typeof riskIcons, i: number) => (
                           <Badge key={i} variant="outline" className="flex items-center gap-1">
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
              <Button variant="outline" disabled={!itinerary || isLoading} onClick={handlePdfDownload}>
                  <Download className="mr-2" /> {t.downloadPDF}
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.details}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                        <FormControl><Input {...field} placeholder="e.g., Goa" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                   <FormField
                    control={form.control}
                    name="nl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.describeTrip}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder={t.examplePrompt} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        <FormItem><FormLabel className="font-normal text-sm">{t.adults}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl></FormItem>
                      )} />
                       <FormField name="party.kids" render={({ field }) => (
                        <FormItem><FormLabel className="font-normal text-sm">{t.kids}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl></FormItem>
                      )} />
                       <FormField name="party.seniors" render={({ field }) => (
                        <FormItem><FormLabel className="font-normal text-sm">{t.seniors}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl></FormItem>
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
                 <Button type="submit" size="lg" className="w-full" disabled={isLoading || isAdjusting}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                    {isLoading ? t.generating : (itinerary ? t.regenerate : t.generate)}
                  </Button>
              </div>

            </form>
          </div>

          <div className="lg:col-span-2" ref={itineraryRef}>
            <h2 className="text-2xl font-bold mb-4 font-headline">{itinerary ? itinerary.trip.title : t.itineraryView}</h2>
            
            {(isLoading && !isAdjusting) && (
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
              <div className="flex flex-col-reverse lg:flex-row gap-8">
                <div className="flex-grow">
                  <Tabs defaultValue="day-0" className="w-full">
                    <TabsList>
                      {itinerary.days.map((day, index) => (
                        <TabsTrigger key={index} value={`day-${index}`}>{t.day} {index + 1}: {day.city}</TabsTrigger>
                      ))}
                    </TabsList>
                    {itinerary.days.map((day, index) => (
                      <TabsContent key={index} value={`day-${index}`}>
                        <div className="relative pt-4 pl-4">
                          <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-border -z-10"></div>
                          <div className="space-y-6">
                            {day.segments.map((segment, segIndex) => renderSegmentCard(segment, segIndex))}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                <aside className="lg:w-80 lg:shrink-0 space-y-6">
                   <Card>
                    <CardHeader><CardTitle>{t.feedbackPrompt}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <Textarea 
                        placeholder={t.feedbackPlaceholder}
                        value={modificationPrompt}
                        onChange={(e) => setModificationPrompt(e.target.value)}
                      />
                      <Button onClick={handleAdjustItinerary} disabled={isAdjusting || !modificationPrompt} className="w-full">
                        {isAdjusting ? <Loader2 className="animate-spin mr-2" /> : <Send />}
                        {isAdjusting ? t.adjusting : t.adjustItinerary}
                      </Button>
                    </CardContent>
                  </Card>
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Download,
  Languages,
  Loader2,
  Send,
  CloudRain,
  Sun,
  Users,
  Beer,
  Grip,
  PlusCircle,
  Trash2,
  Ship,
  Hotel,
  Utensils,
  Landmark,
  ChevronDown,
  MapPin,
  Star,
  Save,
} from 'lucide-react';
import type { Itinerary } from '@/lib/types';
import { adjustItinerary } from '@/ai/flows/dynamic-itinerary-adjustment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const translations = {
  en: {
    title: 'Your Custom Itinerary',
    saveToDashboard: 'Save to Dashboard',
    downloadPDF: 'Download PDF',
    adjusting: 'Adjusting...',
    liveChecks: 'Trip Dashboard',
    budgetStatus: 'Budget Status',
    weatherRisks: 'Weather & Risks',
    packingList: 'Packing List',
    checklist: 'Pre-Travel Checklist',
    day: 'Day',
    feedbackPrompt: 'What changes would you like to make?',
    feedbackPlaceholder: "e.g., 'Make day 2 more relaxed' or 'Add a museum visit'",
    adjustItinerary: 'Adjust Itinerary',
    adjustmentErrorToastTitle: 'Adjustment Failed',
    adjustmentErrorToastDescription: 'The itinerary could not be adjusted. Please try a different request.',
    emptyState: 'No itinerary found. Please go back to the plan page to generate one.',
    backToPlan: 'Back to Plan',
    addItem: 'Add item',
    viewInMap: 'View in Maps',
    saveSuccessTitle: 'Itinerary Saved',
    saveSuccessDescription: 'Your itinerary has been saved to your dashboard.',
    saveErrorTitle: 'Save Failed',
    saveErrorDescription: 'Could not save itinerary. Please try again.',
  },
  hi: {
    title: 'आपकी कस्टम यात्रा कार्यक्रम',
    saveToDashboard: 'डैशबोर्ड पर सहेजें',
    downloadPDF: 'पीडीएफ डाउनलोड करें',
    adjusting: 'समायोजित कर रहा है...',
    liveChecks: 'ट्रिप डैशबोर्ड',
    budgetStatus: 'बजट स्थिति',
    weatherRisks: 'मौसम और जोखिम',
    packingList: 'पैकिंग सूची',
    checklist: 'यात्रा-पूर्व जांच सूची',
    day: 'दिन',
    feedbackPrompt: 'आप क्या बदलाव करना चाहेंगे?',
    feedbackPlaceholder: "जैसे, 'दिन 2 को और आरामदायक बनाएं' या 'एक संग्रहालय यात्रा जोड़ें'",
    adjustItinerary: 'यात्रा कार्यक्रम समायोजित करें',
    adjustmentErrorToastTitle: 'समायोजन विफल',
    adjustmentErrorToastDescription: 'यात्रा कार्यक्रम समायोजित नहीं किया जा सका। कृपया एक अलग अनुरोध का प्रयास करें।',
    emptyState: 'कोई यात्रा कार्यक्रम नहीं मिला। कृपया एक बनाने के लिए योजना पृष्ठ पर वापस जाएं।',
    backToPlan: 'योजना पर वापस जाएं',
    addItem: 'आइटम जोड़ें',
    viewInMap: 'मानचित्र में देखें',
    saveSuccessTitle: 'यात्रा कार्यक्रम सहेजा गया',
    saveSuccessDescription: 'आपका यात्रा कार्यक्रम आपके डैशबोर्ड में सहेज लिया गया है।',
    saveErrorTitle: 'सहेजें विफल',
    saveErrorDescription: 'यात्रा कार्यक्रम सहेजा नहीं जा सका। कृपया फिर से प्रयास करें।',
  },
};

export default function ItineraryPage() {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [customChecklistItem, setCustomChecklistItem] = useState('');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = translations[lang];

  useEffect(() => {
    let storedItinerary: string | null = null;
    const tripId = searchParams.get('tripId');
    if (tripId) {
      const savedItineraries = JSON.parse(localStorage.getItem('savedItineraries') || '[]');
      const foundItinerary = savedItineraries.find((i: Itinerary) => i.trip.title === tripId);
      if(foundItinerary) {
        setItinerary(foundItinerary);
        return;
      }
    }
    
    storedItinerary = sessionStorage.getItem('itinerary');
    if (storedItinerary) {
      setItinerary(JSON.parse(storedItinerary));
    }
  }, [searchParams]);

  useEffect(() => {
    if (itinerary) {
      sessionStorage.setItem('itinerary', JSON.stringify(itinerary));
    }
  }, [itinerary]);
  
  const handleSaveItinerary = () => {
    if (!itinerary) return;
    try {
      const savedItineraries = JSON.parse(localStorage.getItem('savedItineraries') || '[]');
      const newSavedItineraries = [...savedItineraries.filter((i: Itinerary) => i.trip.title !== itinerary.trip.title), itinerary];
      localStorage.setItem('savedItineraries', JSON.stringify(newSavedItineraries));
      toast({
        title: t.saveSuccessTitle,
        description: t.saveSuccessDescription,
      });
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast({
        variant: 'destructive',
        title: t.saveErrorTitle,
        description: t.saveErrorDescription,
      });
    }
  };

  const handlePdfDownload = () => {
    if (!itinerary) return;
    const doc = new jsPDF() as jsPDFWithAutoTable;

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    doc.setFont('Lora', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(41, 51, 61);
    doc.text(itinerary.trip.title, pageWidth / 2, 20, { align: 'center' });

    doc.setFont('Inter', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${itinerary.trip.cities.join(', ')} | ${format(new Date(itinerary.trip.start), 'do MMMM yyyy')} - ${format(
        new Date(itinerary.trip.end),
        'do MMMM yyyy'
      )}`,
      pageWidth / 2,
      28,
      { align: 'center' }
    );
    
    doc.autoTable({
      body: [
        ['Total Budget', `${itinerary.trip.currency} ${itinerary.trip.budget.toLocaleString()}`],
        ['Estimated Cost', `${itinerary.trip.currency} ${itinerary.totals.est.toLocaleString()}`],
        ['Travelers', `${itinerary.party?.length || 1}`],
      ],
      startY: 35,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'right' },
        1: { halign: 'left' }
      },
      tableWidth: 80,
      margin: { left: pageWidth/2 - 40 },
    });

    let y = (doc as any).lastAutoTable.finalY + 15;

    itinerary.days.forEach((day, index) => {
      if (y > 250) {
        doc.addPage();
        y = margin;
      }
      doc.setFont('Lora', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(41, 51, 61);
      doc.text(`Day ${index + 1}: ${day.city}`, margin, y);
      doc.setFont('Inter', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(format(new Date(day.date), 'EEEE, MMMM do'), margin, y + 5);
      y += 15;

      const segmentsBody = day.segments.map(segment => {
        const time =
          segment.type === 'transport'
            ? `${segment.dep} - ${segment.arr}`
            : segment.window?.join(' - ') || 'All Day';
        const name = `${segment.type.charAt(0).toUpperCase() + segment.type.slice(1)}: ${segment.name || `${segment.from} → ${segment.to}`}`;
        const cost = segment.estCost ? `${itinerary.trip.currency} ${segment.estCost}` : 'Free';
        const details = [
          segment.description,
          segment.rating ? `Rating: ★ ${segment.rating}` : null,
          segment.risk?.length ? `Risks: ${segment.risk.join(', ')}` : null,
        ].filter(Boolean).join('\n');
        return [time, `${name}\n${details}`, cost];
      });

      doc.autoTable({
        startY: y,
        head: [['Time', 'Activity / Leg', 'Est. Cost']],
        body: segmentsBody,
        theme: 'striped',
        headStyles: { fillColor: [33, 150, 243] }, // Primary color
        styles: {
            valign: 'middle'
        },
        didDrawPage: data => {
          y = data.cursor?.y || margin;
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    });

    if (itinerary.packingList.length > 0 || itinerary.checklist.length > 0) {
      if (y > 260) { doc.addPage(); y = margin; }
      doc.setFont('Lora', 'bold');
      doc.setFontSize(14);
      doc.text('Pre-Travel Preparation', margin, y);
      y += 8;

      const listBody = [
          ['Packing List', itinerary.packingList.map(item => `- ${item}`).join('\n')],
          ['Checklist', itinerary.checklist.map(item => `- ${item}`).join('\n')],
      ];
      
      doc.autoTable({
          startY: y,
          body: listBody,
          theme: 'grid',
          columnStyles: { 0: { fontStyle: 'bold' } },
      });
    }

    doc.save(`Itinerary-${itinerary.trip.title.replace(/\s+/g, '-')}.pdf`);
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
        setModificationPrompt('');
      } else {
        console.error('Invalid adjusted itinerary format received from AI:', result);
        throw new Error('Invalid itinerary format');
      }
    } catch (error) {
      console.error('Error adjusting itinerary:', error);
      toast({
        variant: 'destructive',
        title: t.adjustmentErrorToastTitle,
        description: (error as Error).message || t.adjustmentErrorToastDescription,
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleAddChecklistItem = () => {
    if (!customChecklistItem.trim() || !itinerary) return;
    setItinerary({
      ...itinerary,
      checklist: [...itinerary.checklist, customChecklistItem.trim()],
    });
    setCustomChecklistItem('');
  };



  const handleRemoveChecklistItem = (itemToRemove: string) => {
    if (!itinerary) return;
    setItinerary({
      ...itinerary,
      checklist: itinerary.checklist.filter(item => item !== itemToRemove),
    });
  };

  const renderSegmentCard = (segment: any, segIndex: number) => {
    const typeIcons = {
        transport: <Ship className="w-5 h-5 text-primary" />,
        activity: <Landmark className="w-5 h-5 text-primary" />,
        meal: <Utensils className="w-5 h-5 text-primary" />,
        free: <Hotel className="w-5 h-5 text-primary" />,
    };

    const riskIcons = {
      rain: <CloudRain className="w-4 h-4 text-blue-500" />,
      heat: <Sun className="w-4 h-4 text-orange-500" />,
      crowd: <Users className="w-4 h-4 text-yellow-500" />,
      'late-night': <Beer className="w-4 h-4 text-purple-500" />,
      closure: <Grip className="w-4 h-4 text-red-500" />,
    };

    return (
      <div key={segIndex} className="relative ml-12">
        <div className="absolute -left-12 top-4 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            {typeIcons[segment.type as keyof typeof typeIcons]}
        </div>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <div className="p-4 rounded-lg bg-card border shadow-sm transition-all hover:shadow-md cursor-pointer group">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="secondary" className="capitalize mb-2">{segment.type}</Badge>
                  <h4 className="font-bold text-lg">{segment.name || `${segment.from} → ${segment.to}`}</h4>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-semibold text-lg">{segment.estCost ? `₹${segment.estCost}` : ''}</p>
                  <p className="text-sm text-muted-foreground">
                    {segment.dep && segment.arr ? `${segment.dep} - ${segment.arr}` : segment.window?.join(' - ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end mt-2">
                 <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
             <div className="p-4 rounded-b-lg bg-card border-x border-b -mt-2">
                {segment.description && <p className="text-muted-foreground mb-4">{segment.description}</p>}
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {segment.rating && (
                      <Badge variant="default" className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-black">
                        <Star className="w-4 h-4" /> {segment.rating}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2">
                      {segment.risk?.map((r: keyof typeof riskIcons, i: number) => (
                        <Badge key={i} variant="outline" className="flex items-center gap-1 capitalize">
                          {riskIcons[r]} {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {segment.placeId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        let url = `https://www.google.com/maps/search/?api=1&query_place_id=${segment.placeId}`;
                        if (segment.lat && segment.lon) {
                           url = `https://www.google.com/maps/search/?api=1&query=${segment.lat},${segment.lon}&query_place_id=${segment.placeId}`;
                        }
                        window.open(url, '_blank')
                      }}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {t.viewInMap}
                    </Button>
                  )}
                </div>
             </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };
  
  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] bg-background text-center p-8">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader>
            <CardTitle>{t.emptyState}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/plan')}>{t.backToPlan}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">
              {itinerary.trip.title}
            </h1>
            <p className="text-muted-foreground">{itinerary.trip.cities.join(', ')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>
              <Languages />
            </Button>
            <Button variant="outline" onClick={handleSaveItinerary}>
              <Save className="mr-2" /> {t.saveToDashboard}
            </Button>
            <Button onClick={handlePdfDownload}>
              <Download className="mr-2" /> {t.downloadPDF}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow">
            <Tabs defaultValue="day-0" className="w-full">
              <TabsList className="bg-background shadow-inner">
                {itinerary.days.map((day, index) => (
                  <TabsTrigger key={index} value={`day-${index}`} className="text-base">
                    {t.day} {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              {itinerary.days.map((day, index) => (
                <TabsContent key={index} value={`day-${index}`}>
                  <div className="relative pt-8 pb-4 pl-4">
                    <div className="absolute left-[2.37rem] top-8 bottom-4 w-0.5 bg-border rounded-full -z-10"></div>
                    <div className="space-y-6">
                      {day.segments.map((segment, segIndex) => renderSegmentCard(segment, segIndex))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <aside className="lg:w-96 lg:shrink-0 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t.feedbackPrompt}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder={t.feedbackPlaceholder}
                  value={modificationPrompt}
                  onChange={e => setModificationPrompt(e.target.value)}
                  rows={3}
                  className="bg-secondary/50"
                />
                <Button onClick={handleAdjustItinerary} disabled={isAdjusting || !modificationPrompt} className="w-full">
                  {isAdjusting ? <Loader2 className="animate-spin mr-2" /> : <Send />}
                  {isAdjusting ? t.adjusting : t.adjustItinerary}
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t.liveChecks}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <label>{t.budgetStatus}</label>
                    <span className="text-muted-foreground">
                      ₹{itinerary.totals.est.toLocaleString()} / ₹{itinerary.trip.budget.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={(itinerary.totals.est / itinerary.trip.budget) * 100} className="mt-2 h-2" />
                </div>
                {itinerary.risks && itinerary.risks.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">{t.weatherRisks}</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {itinerary.risks
                        .filter(r => r.kind === 'rain' || r.kind === 'heat')
                        .map((risk, i) => (
                          <Badge key={i} variant="destructive" className="capitalize">
                            {risk.severity} {risk.kind} on {new Date(risk.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t.packingList}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {itinerary.packingList?.map((item, i) => (
                  <Badge key={i} variant="secondary" className="text-base">
                    {item}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t.checklist}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {itinerary.checklist?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <Checkbox id={`checklist-${i}`} className="w-5 h-5"/>
                    <label htmlFor={`checklist-${i}`} className="text-sm flex-grow cursor-pointer peer-data-[state=checked]:line-through">
                      {item}
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveChecklistItem(item)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-3 border-t">
                  <Input
                    placeholder={t.addItem}
                    value={customChecklistItem}
                    onChange={e => setCustomChecklistItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                    className="h-9 bg-secondary/50"
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAddChecklistItem}>
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

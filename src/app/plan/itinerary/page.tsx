'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import type { Itinerary } from '@/lib/types';
import { adjustItinerary } from '@/ai/flows/dynamic-itinerary-adjustment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const translations = {
  en: {
    title: 'Your Custom Itinerary',
    demo: 'Demo',
    downloadPDF: 'Download PDF',
    regenerate: 'Regenerate with changes',
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
  },
  hi: {
    title: 'आपकी कस्टम यात्रा कार्यक्रम',
    demo: 'डेमो',
    downloadPDF: 'पीडीएफ डाउनलोड करें',
    regenerate: 'बदलावों के साथ फिर से बनाएं',
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
  const t = translations[lang];

  useEffect(() => {
    const storedItinerary = sessionStorage.getItem('itinerary');
    if (storedItinerary) {
      setItinerary(JSON.parse(storedItinerary));
    }
  }, []);

  useEffect(() => {
    if (itinerary) {
      sessionStorage.setItem('itinerary', JSON.stringify(itinerary));
    }
  }, [itinerary]);

  const handlePdfDownload = () => {
    if (!itinerary) return;

    const pdf = new jsPDF() as jsPDFWithAutoTable;
    const margin = 15;

    // Title
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text(itinerary.trip.title, pdf.internal.pageSize.getWidth() / 2, margin, { align: 'center' });

    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `${itinerary.trip.cities.join(', ')} | ${format(new Date(itinerary.trip.start), 'PPP')} - ${format(
        new Date(itinerary.trip.end),
        'PPP'
      )}`,
      pdf.internal.pageSize.getWidth() / 2,
      margin + 8,
      { align: 'center' }
    );
    pdf.text(
      `Budget: ${itinerary.trip.currency} ${itinerary.totals.est.toLocaleString()} / ${itinerary.trip.budget.toLocaleString()}`,
      pdf.internal.pageSize.getWidth() / 2,
      margin + 14,
      { align: 'center' }
    );

    let y = margin + 30;

    itinerary.days.forEach((day, index) => {
      if (y > 250) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Day ${index + 1}: ${day.city} (${format(new Date(day.date), 'EEE, MMM d')})`, margin, y);
      y += 8;

      const segmentsBody = day.segments.map(segment => {
        const time =
          segment.type === 'transport'
            ? `${segment.dep} - ${segment.arr}`
            : segment.window?.join(' - ') || 'N/A';
        const name = segment.name || `${segment.from} → ${segment.to}`;
        const cost = segment.estCost ? `${itinerary.trip.currency} ${segment.estCost}` : 'Free';
        return [time, name, cost];
      });

      pdf.autoTable({
        startY: y,
        head: [['Time', 'Activity / Leg', 'Est. Cost']],
        body: segmentsBody,
        theme: 'striped',
        headStyles: { fillColor: [39, 100, 50] }, // Primary color
        didDrawPage: data => {
          y = data.cursor?.y || margin;
        },
      });
      y = (pdf as any).lastAutoTable.finalY + 10;
    });

    // Add Checklists
    if (itinerary.packingList.length > 0 || itinerary.checklist.length > 0) {
      if (y > 250) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pre-Travel Preparation', margin, y);
      y += 8;

      if (itinerary.packingList.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Packing List', margin, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
        itinerary.packingList.forEach(item => {
          pdf.text(`- ${item}`, margin + 5, y);
          y += 6;
        });
      }

      if (itinerary.checklist.length > 0) {
        if (y > 260) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Checklist', margin, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
        itinerary.checklist.forEach(item => {
          pdf.text(`- ${item}`, margin + 5, y);
          y += 6;
        });
      }
    }

    pdf.save(`Itinerary-${itinerary.trip.title.replace(/\s+/g, '-')}.pdf`);
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
        setModificationPrompt(''); // Clear prompt on success
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
            <Badge variant="secondary" className="capitalize mb-2">
              {segment.type}
            </Badge>
            <h4 className="font-bold text-lg">{segment.name || `${segment.from} → ${segment.to}`}</h4>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="font-semibold text-lg">{segment.estCost ? `₹${segment.estCost}` : ''}</p>
            <p className="text-sm text-muted-foreground">
              {segment.dep && segment.arr ? `${segment.dep} - ${segment.arr}` : segment.window?.join(' - ')}
            </p>
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

  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-8">
        <Card className="max-w-md w-full">
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <h1 className="text-2xl font-bold font-headline">
            {itinerary.trip.title} <Badge variant="outline">{t.demo}</Badge>
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>
              <Languages />
            </Button>
            <Button variant="outline" onClick={handlePdfDownload}>
              <Download className="mr-2" /> {t.downloadPDF}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow">
            <Tabs defaultValue="day-0" className="w-full">
              <TabsList>
                {itinerary.days.map((day, index) => (
                  <TabsTrigger key={index} value={`day-${index}`}>
                    {t.day} {index + 1}: {day.city}
                  </TabsTrigger>
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

          <aside className="lg:w-96 lg:shrink-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.feedbackPrompt}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  placeholder={t.feedbackPlaceholder}
                  value={modificationPrompt}
                  onChange={e => setModificationPrompt(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAdjustItinerary} disabled={isAdjusting || !modificationPrompt} className="w-full">
                  {isAdjusting ? <Loader2 className="animate-spin mr-2" /> : <Send />}
                  {isAdjusting ? t.adjusting : t.adjustItinerary}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.liveChecks}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t.budgetStatus}</label>
                  <Progress value={(itinerary.totals.est / itinerary.trip.budget) * 100} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    ₹{itinerary.totals.est.toLocaleString()} / ₹{itinerary.trip.budget.toLocaleString()}
                  </p>
                </div>
                {itinerary.risks && itinerary.risks.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">{t.weatherRisks}</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {itinerary.risks
                        .filter(r => r.kind === 'rain' || r.kind === 'heat')
                        .map((risk, i) => (
                          <Badge key={i} variant="outline" className="capitalize">
                            {risk.severity} {risk.kind} on {new Date(risk.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.packingList}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {itinerary.packingList?.map((item, i) => (
                  <Badge key={i} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.checklist}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {itinerary.checklist?.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <Checkbox id={`checklist-${i}`} />
                    <label htmlFor={`checklist-${i}`} className="text-sm flex-grow">
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
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Input
                    placeholder={t.addItem}
                    value={customChecklistItem}
                    onChange={e => setCustomChecklistItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                    className="h-8"
                  />
                  <Button size="icon" className="h-8 w-8" onClick={handleAddChecklistItem}>
                    <PlusCircle className="h-4 w-4" />
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

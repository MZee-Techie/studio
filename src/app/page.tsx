import Image from 'next/image';
import Link from 'next/link';
import { Bot, Download, Map, MessageSquarePlus, ShieldCheck, Wallet, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const features = [
  {
    icon: <Sparkles className="w-8 h-8 text-accent" />,
    title: 'Smart Itinerary Generation',
    description: 'Our AI crafts personalized day-by-day itineraries based on your interests, budget, and travel style.',
  },
  {
    icon: <Map className="w-8 h-8 text-accent" />,
    title: 'Multi-City Planning',
    description: 'Effortlessly plan trips spanning multiple destinations with a flexible, day-by-day structure.',
  },
  {
    icon: <Wallet className="w-8 h-8 text-accent" />,
    title: 'Budget Management',
    description: 'Keep your spending in check with our intuitive budget tracker and cost-saving suggestions.',
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-accent" />,
    title: 'Risk Assessment',
    description: 'Travel with confidence. We monitor conditions to provide timely safety alerts for your trip.',
  },
  {
    icon: <Download className="w-8 h-8 text-accent" />,
    title: 'Downloadable Itinerary',
    description: 'Export your complete itinerary as a beautifully formatted PDF for offline access on any device.',
  },
  {
    icon: <MessageSquarePlus className="w-8 h-8 text-accent" />,
    title: 'Interactive Adjustments',
    description: 'Fine-tune your plan on the fly. Our AI understands natural language to modify your itinerary.',
  },
];

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-background');

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <section className="relative w-full h-[75vh] md:h-[90vh]">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-foreground px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold tracking-tight text-shadow-lg shadow-black/30">
            EaseMyJourn<span className="text-accent">AI</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-foreground/90 text-shadow-sm shadow-black/20">
            Your personal AI travel assistant. Crafting unforgettable journeys, just for you.
          </p>
          <Button asChild size="lg" className="mt-8 shadow-lg transition-transform hover:scale-105 active:scale-100 font-bold text-lg">
            <Link href="/plan">Start Planning Your Trip</Link>
          </Button>
        </div>
      </section>

      <section id="features" className="w-full py-20 md:py-28 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-3">
               <h2 className="text-3xl font-headline font-bold tracking-tight sm:text-5xl">
                The Future of Travel Planning
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                From AI-powered itineraries to seamless booking, we've got every step of your journey covered.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-16">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-transparent hover:border-primary/30">
                <CardHeader className="flex flex-row items-center gap-4">
                  {feature.icon}
                  <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-20 md:py-28 lg:py-32 bg-secondary/50">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-headline font-bold tracking-tighter md:text-4xl/tight">
              Ready to Start Your Adventure?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed">
              Let our AI find the best destinations and activities for you. Your dream trip is just a click away.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-2 mt-6">
            <Button asChild size="lg" className="w-full shadow-lg transition-transform hover:scale-105 active:scale-100 font-bold text-lg">
              <Link href="/plan">
                Plan a New Trip
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

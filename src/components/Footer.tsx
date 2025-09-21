import Link from 'next/link';
import { Logo } from './logo';
import { Github, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-background text-secondary-foreground py-8 border-t">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Logo />
        </div>
        <div className="text-center md:text-left mb-4 md:mb-0">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} EaseMyJournAI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            AI-powered travel planning for the modern adventurer.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="#" className="text-muted-foreground hover:text-primary">
            <Twitter className="h-5 w-5" />
            <span className="sr-only">Twitter</span>
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-primary">
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-primary">
            <Instagram className="h-5 w-5" />
            <span className="sr-only">Instagram</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}

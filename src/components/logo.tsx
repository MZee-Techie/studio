import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Plane className="h-6 w-6 text-primary" />
      <span className="text-xl font-headline font-bold">EasedYourTrip</span>
    </div>
  );
}

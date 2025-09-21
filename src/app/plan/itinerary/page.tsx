import { Suspense } from 'react';
import ItineraryClientPage from './itinerary-client-page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

function ItineraryLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="p-6 text-sm text-slate-500">Loading itinerary…</div>
    </div>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={<ItineraryLoading />}>
      <ItineraryClientPage />
    </Suspense>
  );
}

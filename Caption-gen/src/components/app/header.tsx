import { CarFront } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <CarFront className="h-6 w-6 text-primary" />
          <h1 className="ml-3 text-xl font-bold tracking-tight text-foreground">
            In-Vehicle Social Pulse
          </h1>
        </div>
      </div>
    </header>
  );
}

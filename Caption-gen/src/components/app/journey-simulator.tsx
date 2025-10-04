import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, Smile, Cloud, CalendarDays } from 'lucide-react';
import type { JourneyMoment } from '@/lib/data';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

type JourneySimulatorProps = {
  moment: JourneyMoment;
  image: ImagePlaceholder;
  onGenerate: () => void;
  isActionable: boolean;
};

const metadataIcons = {
  location: <MapPin className="h-4 w-4 text-muted-foreground" />,
  mood: <Smile className="h-4 w-4 text-muted-foreground" />,
  weather: <Cloud className="h-4 w-4 text-muted-foreground" />,
  event: <CalendarDays className="h-4 w-4 text-muted-foreground" />,
};

export function JourneySimulator({ moment, image, onGenerate, isActionable }: JourneySimulatorProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Current Moment</CardTitle>
        <CardDescription>{moment.metadata.scene}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="aspect-video overflow-hidden rounded-lg border">
          <Image
            src={image.imageUrl}
            alt={image.description}
            width={1280}
            height={720}
            className="h-full w-full object-cover transition-transform hover:scale-105"
            data-ai-hint={image.imageHint}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries(moment.metadata).map(([key, value]) => {
            if (key === 'scene') return null;
            return (
              <div key={key} className="flex items-start gap-2">
                {metadataIcons[key as keyof typeof metadataIcons]}
                <div>
                  <p className="capitalize text-muted-foreground">{key}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Button onClick={onGenerate} disabled={!isActionable} size="lg" className="w-full">
          <Sparkles className="mr-2 h-5 w-5" />
          Generate Social Post
        </Button>
      </CardContent>
    </Card>
  );
}

import type { ImagePlaceholder } from './placeholder-images';

export type JourneyMetadata = {
  scene: string;
  location: string;
  mood: string;
  weather: string;
  event: string;
};

export type JourneyMoment = {
  id: number;
  imageId: ImagePlaceholder['id'];
  metadata: JourneyMetadata;
};

export const journeyData: JourneyMoment[] = [
  {
    id: 1,
    imageId: 'sunset-drive',
    metadata: {
      scene: 'Sunset highway drive',
      location: 'Pacific Coast Highway',
      mood: 'Peaceful',
      weather: 'Clear',
      event: 'Solo evening cruise',
    },
  },
  {
    id: 2,
    imageId: 'friends-car',
    metadata: {
      scene: 'Friends in a car',
      location: 'Countryside road',
      mood: 'Excited',
      weather: 'Sunny',
      event: 'Road trip with friends',
    },
  },
  {
    id: 3,
    imageId: 'city-night',
    metadata: {
      scene: 'City night drive',
      location: 'Downtown Tokyo',
      mood: 'Energetic',
      weather: 'Clear',
      event: 'Exploring the city lights',
    },
  },
  {
    id: 4,
    imageId: 'rainy-road',
    metadata: {
      scene: 'Driving in the rain',
      location: 'Mountain pass',
      mood: 'Contemplative',
      weather: 'Rainy',
      event: 'A quiet, rainy day drive',
    },
  },
];

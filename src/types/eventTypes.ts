// types/events.ts

export interface EventImage {
  path: string;
  alt?: string;
}

export interface EventItem {
  id: number;
  title: string;
  description?: string; // make optional if not always present
  image: string; // primary thumbnail
  images?: EventImage[]; // optional gallery
  date?: string;
  time?: string;
  location?: string;
  category?: string;
  eventTitle?: string; // optional extra title
}

export interface Action {
  label: string;
  onClick: () => void;
}

export interface EventModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  primaryAction?: Action;
  secondaryAction?: Action;
}

export interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  uploadedAt: string;
}

import { Timestamp } from 'firebase/firestore';

export type Poem = {
  id: string; // Firestore document ID
  title: string;
  content: string;
  font: string;
  imageUrl?: string | null;
  likes: number;
  
  authorId: string;
  authorEmail: string;
  createdAt: Timestamp;
};

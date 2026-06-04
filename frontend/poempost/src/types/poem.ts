import { Timestamp } from 'firebase/firestore';

export type Poem = {
  id: string; // Firestore document ID
  title: string;
  content: string;
  font: string;
  imageUrl?: string | null;
  likes: string[];        // array of user UIDs — single schema across all files
  authorId: string;
  authorName: string;     // display name; read fallback: authorName || authorEmail
  authorEmail: string;    // kept for legacy doc compatibility
  createdAt: Timestamp;
};

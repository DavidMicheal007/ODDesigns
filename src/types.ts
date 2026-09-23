export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'artist' | 'brand_manager' | 'admin';
  walletBalance: number;
  specialization: 'Streetwear' | 'Minimalism' | 'Typography';
  reputationScore: number;
  bio: string;
  socialLinks: { x?: string; instagram?: string; portfolio?: string };
  createdAt: string;
}

export interface Design {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  imageUrl: string;
  prompt: string;
  price: number;
  status: 'draft' | 'published' | 'sold';
  createdAt: string;
  tags: string[];
}

export interface MarketplaceItem {
  id: string;
  designId: string;
  sellerId: string;
  price: number;
  listedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: string;
}

export interface Collaboration {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  type: 'looking_for_artist' | 'looking_for_brand' | 'looking_for_influencer';
  createdAt: string;
}

export interface Review {
  id: string;
  designId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface WarRoom {
  id: string;
  designId: string;
  participants: string[]; // User IDs
  createdAt: string;
  status: 'active' | 'archived';
}

export interface WarRoomComment {
  id: string;
  warRoomId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  x: number; // Percent 0-100 for pinning
  y: number; // Percent 0-100 for pinning
  createdAt: string;
}

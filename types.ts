
export type UserRole = 'member' | 'verified' | 'creator' | 'admin';

export type Region = 'en-GB' | 'en-US' | 'de-DE' | 'fr-FR' | 'ja-JP';

export type PresenceStatus = 'Online' | 'Focus' | 'Invisible' | 'Away' | 'In-Transit';

export interface WeatherInfo {
  temp: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  icon: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  registrationDisabled: boolean;
  minTrustTier: 'Alpha' | 'Beta' | 'Gamma';
  lastUpdatedBy: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  followers: number;
  following: number;
  role: UserRole;
  location: string;
  joinedAt: string;
  badges: string[];
  isSuspended?: boolean;
  verifiedHuman?: boolean;
  
  // 2026 Identity Extensions
  dob?: string;
  pronouns?: string;
  website?: string;
  tags?: string[];
  trustTier?: 'Alpha' | 'Beta' | 'Gamma';

  // Advanced Social Hub Data
  education?: string;
  occupation?: string;
  relationshipStatus?: 'Single' | 'Partnered' | 'Married' | 'Encoded' | 'Private';
  hobbies?: string[];
  skills?: string[];
  presenceStatus?: PresenceStatus;
  socialLinks?: {
    platform: string;
    url: string;
  }[];
  lifeEvents?: {
    id: string;
    title: string;
    date: string;
    icon: string;
  }[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  media: {
    type: 'image' | 'video' | 'file';
    url: string;
    thumbnail?: string;
  }[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isLiked?: boolean;
  timestamp?: any;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  icon: string;
  category: string;
}

export enum AppRoute {
  FEED = 'feed',
  EXPLORE = 'explore',
  CREATE = 'create',
  MESSAGES = 'messages',
  PROFILE = 'profile',
  COMMUNITIES = 'communities',
  ADMIN = 'admin'
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}


export type UserRole = 'member' | 'verified' | 'creator' | 'admin';

export type Region = 'en-GB' | 'en-US' | 'de-DE' | 'fr-FR' | 'ja-JP';

export type PresenceStatus = 'Online' | 'Focus' | 'Invisible' | 'Away' | 'In-Transit' | 'Deep Work' | 'Syncing';

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
  featureFlags: Record<string, boolean>;
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
  dob?: string;
  pronouns?: string;
  website?: string;
  tags?: string[];
  trustTier?: 'Alpha' | 'Beta' | 'Gamma';
  education?: string;
  occupation?: string;
  relationshipStatus?: 'Single' | 'Partnered' | 'Married' | 'Encoded' | 'Private';
  hobbies?: string[];
  skills?: string[];
  presenceStatus?: PresenceStatus;
  statusMessage?: string;
  statusEmoji?: string;
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

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  coverUrl: string;
  timestamp: any;
  expiresAt: any;
  isActive: boolean;
}

export interface LiveStream {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  thumbnailUrl: string;
  viewerCount: number;
  startedAt: any;
  category: string;
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
  likedBy?: string[];
}

export interface Chat {
  id: string;
  participants: string[];
  participantData: Record<string, { displayName: string; avatarUrl: string }>;
  lastMessage?: string;
  lastMessageTimestamp?: any;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
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
  ADMIN = 'admin',
  PRIVACY = 'privacy',
  TERMS = 'terms',
  COOKIES = 'cookies',
  MESH = 'mesh',
  CLUSTERS = 'clusters',
  STREAM_GRID = 'streams',
  TEMPORAL = 'temporal',
  SAVED = 'saved',
  VERIFIED_NODES = 'nodes',
  GATHERINGS = 'gatherings',
  SIMULATIONS = 'sims',
  RESILIENCE = 'resilience'
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

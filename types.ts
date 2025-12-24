
export type UserRole = 'member' | 'verified' | 'creator' | 'admin';

export type Region = 'en-GB' | 'en-US' | 'de-DE' | 'fr-FR' | 'ja-JP';

export type PresenceStatus = 'Online' | 'Focus' | 'Invisible' | 'Away' | 'In-Transit' | 'Deep Work' | 'Syncing';

export type SignalAudience = 'global' | 'mesh' | 'private';

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

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'broadcast' | 'system' | 'relay' | 'call' | 'cluster_invite' | 'packet_summary' | 'message' | 'gathering_rsvp' | 'gathering_create' | 'gathering_promote';

export interface AppNotification {
  id: string;
  type: NotificationType;
  pulseFrequency?: string; 
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  targetId?: string;
  text: string;
  isRead: boolean;
  timestamp: any;
}

export interface InlineReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Comment {
  id: string;
  parentId?: string; 
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  likes: number;
  timestamp: any;
  likedBy?: string[];
  depth?: number;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  contentLengthTier: 'pulse' | 'standard' | 'deep';
  coAuthors?: { id: string, name: string, avatar: string }[];
  capturedStatus?: { emoji: string, message: string };
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
  location?: string;
  audience?: SignalAudience;
  reactions?: Record<string, number>;
  bookmarkedBy?: string[];
  inlineReactions?: Record<number, InlineReaction[]>; 
  relaySource?: {
    postId: string;
    authorName: string;
    authorAvatar: string;
  };
  pulseFrequency?: string; 
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  coverUrl: string;
  timestamp: any;
  type?: 'image' | 'video';
  isArchivedStream?: boolean;
  streamTitle?: string;
  streamStats?: {
    viewers: number;
    duration: string;
  };
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

export interface Gathering {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  title: string;
  description: string;
  date: string; // ISO String
  location: string;
  type: 'physical' | 'virtual';
  category: 'Social' | 'Tech' | 'Gaming' | 'Nightlife' | 'Workshop';
  coverUrl: string;
  attendees: string[]; // Array of User IDs
  maxAttendees?: number; // Optional capacity
  waitlist?: string[]; // Array of User IDs in queue
  createdAt: any;
  linkedChatId?: string; // Neural Lobby ID
}

export interface Chat {
  id: string;
  participants: string[];
  participantData: Record<string, { displayName: string; avatarUrl: string }>;
  lastMessage?: string;
  lastMessageTimestamp?: any;
  isCluster?: boolean;
  isEventLobby?: boolean;
  clusterName?: string;
  clusterAvatar?: string;
  clusterAdmin?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  isRead: boolean;
  isBuffered?: boolean;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
}

export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  status: 'ringing' | 'connected' | 'ended' | 'rejected';
  type: 'voice' | 'video';
  timestamp: any;
}

export enum AppRoute {
  FEED = 'feed',
  EXPLORE = 'explore',
  CREATE = 'create',
  MESSAGES = 'messages',
  NOTIFICATIONS = 'notifications',
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
  SINGLE_GATHERING = 'single_gathering',
  SIMULATIONS = 'sims',
  RESILIENCE = 'resilience',
  SINGLE_POST = 'single_post'
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
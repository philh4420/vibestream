
export type UserRole = 'member' | 'verified' | 'creator' | 'admin';

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
  COMMUNITIES = 'communities'
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

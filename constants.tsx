
import React from 'react';
// Import missing types to resolve "Cannot find name" errors
import { User, Post } from './types';

export const ICONS = {
  Home: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-1.125 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  Explore: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  ),
  Create: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Messages: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.596.596 0 0 1-.474-.065.412.412 0 0 1-.205-.35c0-.18.01-.358.028-.53l.303-2.84A8.25 8.25 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  ),
  Profile: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  Communities: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.998 5.998 0 0 0-12 0m12 0c0-1.077-.282-2.107-.772-3m-10.456 3a5.998 5.998 0 0 1 12 0m-12 0c.49-3.14 3.23-5.632 6.5-5.632 3.27 0 6.01 2.492 6.5 5.632m-13 0c-.025-.219-.037-.441-.037-.666l.001-.031c0-1.077.282-2.107.772-3m5.728-4.436a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm7.5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  Verified: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  )
};

// Added User type annotation to mock data
export const MOCK_USER: User = {
  id: 'u1',
  username: 'design_ninja',
  displayName: 'Oliver Bennett',
  bio: 'Crafting digital experiences for 2026. Living in London, UK. 🇬🇧 #Tech #Design',
  avatarUrl: 'https://picsum.photos/200/200?random=1',
  coverUrl: 'https://picsum.photos/1200/400?random=2',
  followers: 12800,
  following: 420,
  role: 'creator',
  location: 'London, UK',
  joinedAt: 'January 2024',
  badges: ['Early Adopter', 'Top Contributor']
};

// Added Post[] type annotation to mock data
export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'u1',
    authorName: 'Oliver Bennett',
    authorAvatar: 'https://picsum.photos/200/200?random=1',
    content: "The future of social media is decentralized, interactive, and hyper-personalized. What feature are you most excited about for 2026? 🚀 #VibeStream",
    media: [
      { type: 'image', url: 'https://picsum.photos/800/600?random=3' }
    ],
    likes: 1240,
    comments: 84,
    shares: 32,
    createdAt: '2h ago'
  },
  {
    id: 'p2',
    authorId: 'u2',
    authorName: 'Elena Richards',
    authorAvatar: 'https://picsum.photos/200/200?random=4',
    content: "Just finished the marathon in Manchester! The atmosphere was incredible. 🏃‍♀️✨",
    media: [
      { type: 'image', url: 'https://picsum.photos/800/600?random=5' }
    ],
    likes: 3450,
    comments: 120,
    shares: 15,
    createdAt: '5h ago'
  }
];

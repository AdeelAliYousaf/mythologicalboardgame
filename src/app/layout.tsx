import type { Metadata } from 'next';
import './globals.css';
import './board.css';
import './mobile-game.css';
const pageTitle = 'Welcome to Norse Mythology redesign of snake & ladder board game.';
const pageDescription = 'Enter a beautifully redesigned Norse mythology version of the classic Snake & Ladder board game. Play with dragons, ladders, heroes, and fate for two to four players.';
const socialImage = {
  url: 'https://norsemythology.vercel.app/assets/og-graph.png',
  width: 1448,
  height: 1086,
  type: 'image/png',
  alt: 'Welcome to Norse Mythology redesign of snake & ladder board game.',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://norsemythology.vercel.app'),
  title: pageTitle,
  description: pageDescription,
  authors: [{ name: 'art._.chive' }],
  creator: 'art._.chive',
  publisher: 'art._.chive',
  keywords: ['Norse mythology', 'Snake and Ladder', 'Snake & Ladder', 'board game', 'dragon board game', 'online board game'],
  applicationName: 'Dragon Ladder',
  category: 'game',
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    title: pageTitle,
    description: pageDescription,
    siteName: 'Dragon Ladder — Norse Mythology Version',
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: pageDescription,
    images: [socialImage],
  },
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }

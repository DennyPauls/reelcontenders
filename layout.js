import { Bebas_Neue, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const display = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display-family',
});

const body = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-body-family',
});

const mono = IBM_Plex_Mono({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-mono-family',
});

export const metadata = {
  title: 'ReelContenders',
  description: 'A fantasy league for movies that already exist.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

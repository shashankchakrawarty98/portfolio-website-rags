import './globals.css';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Shashank Chakrawarty | Data Engineering Architect',
  description: 'Portfolio of Shashank Chakrawarty, Data Engineering & Cloud Analytics Specialist',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} text-slate-200 antialiased relative selection:bg-cyan-500/30`}>
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
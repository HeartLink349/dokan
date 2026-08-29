import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'محلي - اليوم الأول', description: 'محاكي حياة صاحب محل مصري' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ar" dir="rtl"><body>{children}</body></html>; }

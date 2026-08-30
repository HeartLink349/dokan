import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'دكان الحارة — اليوم الأول',
  description: 'لعبة إدارة بقالة مصرية: فصال، مخزون، زبائن، وسمعة.',
};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ar" dir="rtl"><body>{children}</body></html>; }

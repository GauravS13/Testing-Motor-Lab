import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Test Session | MotorLabPro',
  description: 'Conduct new motor testing sessions, upload data, and view real-time metrics.',
};

export default function TestSessionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

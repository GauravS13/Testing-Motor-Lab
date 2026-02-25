import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | MotorLabPro',
  description: 'Secure login for Motor Testing Lab authorized personnel.',
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

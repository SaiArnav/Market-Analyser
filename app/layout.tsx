import './globals.css';

export const metadata = {
  title: 'MarketAutopsy AI — Market Intelligence Platform',
  description: 'AI-powered market intelligence that monitors news, hiring, patents, and sentiment in real-time — giving founders and investors instant competitive risk scores with evidence-backed insights.',
  keywords: ['market intelligence', 'competitive analysis', 'risk scoring', 'AI research', 'company monitoring'],
  openGraph: {
    title: 'MarketAutopsy AI',
    description: 'AI-powered market intelligence platform for evidence-led company monitoring.',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

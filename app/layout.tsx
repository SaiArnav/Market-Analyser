import './globals.css';

export const metadata = { title: 'MarketAutopsy', description: 'Early warning signals for market shifts' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

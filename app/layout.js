import './globals.css';

export const metadata = {
  title: 'Haidilao Night Wall',
  description: 'Live chat wall — kirim pesanmu ke layar besar!',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a0f55',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

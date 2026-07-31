export const metadata = {
    title: 'Creator Assistant',
    description: 'Ask questions about the content',
  };
  
  export default function RootLayout({ children }) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }
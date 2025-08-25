import "../styles/globals.css";

export const metadata = {
  title: "Photo Board",
  description: "Upload images that show instantly on the main display",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b0f14] text-white antialiased selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { inter, libertinus } from "@/lib/fonts";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Notely — AI-powered study companion",
  description: "Turn any notes into flashcards you'll actually remember. Upload PDFs, slides, or documents and ask questions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${libertinus.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

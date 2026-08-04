import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegistration from "@/components/PwaRegistration";

export const metadata: Metadata = {
  title: "ZeroLogin — Private sharing without the friction",
  description:
    "Create a private, temporary space to share files, text, images, and links without an account.",
  generator: "Next.js",
  applicationName: "zerologin",
  authors: [{ name: "Sneha Naik", url: "https://heydrops.vercel.app/" }],
  keywords: [
    "file sharing",
    "text sharing",
    "zerologin",
    "Sneha Naik",
    "instant sharing",
    "no login",
    "secure file transfer",
    "zerologin by Sneha Naik",
    "Sneha Naik new project",
    "zerologin Sneha Naik",
    "Sneha Naik file sharing website",
  ],
  creator: "Sneha Naik",
  publisher: "Sneha Naik",
  metadataBase: new URL("https://heydrops.vercel.app/"),

  openGraph: {
    title: "Sneha Naik - Drop & Share Instantly",
    description:
      "A fast, effortless way to send files, text, and notes securely to anyone without creating an account. Built with simplicity and privacy in mind",
    url: "https://heydrops.vercel.app/",
    siteName: "zerologin",
    images: [{ url: "/icon-512x512.png", width: 512, height: 512, alt: "ZeroLogin" }],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "zerologin - Drop & Share Instantly",
    description:
      "A fast, effortless way to send files, text, and notes securely to anyone without creating an account. Built with simplicity and privacy in mind",
    creator: "@snehanaik",
    images: ["/icon-512x512.png"],
  },

  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon-192x192.png",
  },

  manifest: "/manifest.webmanifest",
};

// ✅ Fix: move themeColor + colorScheme here
export const viewport: Viewport = {
  themeColor: "#0B0F14",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}

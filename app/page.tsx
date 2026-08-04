"use client";
import Image from "next/image";

import CreateSpaceButton from "@/components/CreateShareSpaceButton";
import { Download, Menu, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const features = [
  "Anonymous Sharing",
  "No Registration",
  "Custom Space URLs",
  "Password Protection",
  "Auto Expiration",
  "File Sharing",
  "Image Sharing",
  "Text Notes",
  "URL Sharing",
  "Drag & Drop Upload",
  "Collaborative Whiteboard",
  "Installable PWA", 
];
const nav = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About Us", href: "#about" },
  { label: "Create Space", href: "#create" },
];

export default function HomePage() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null),
    [open, setOpen] = useState(false),
    [active, setActive] = useState("#home");
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (entry) => entry.isIntersecting && setActive(`#${entry.target.id}`),
        ),
      { threshold: 0.45 },
    );
    document
      .querySelectorAll("main section[id]")
      .forEach((section) => observer.observe(section));
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      observer.disconnect();
    };
  }, []);
  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  };
  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6AA5FF] ${active === href ? "bg-white/10 text-white" : "text-[#94A3B8] hover:text-white"}`;
  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#F5F7FA]">
      <header className="sticky top-0 z-50 border-b border-[#232B36]/80 bg-[#0B0F14]/80 backdrop-blur-xl">
        <nav
          aria-label="Primary navigation"
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
        >
          <a href="#home" className="flex items-center gap-2 font-semibold">
            <Image
              src="/icon.png"
              alt="ZeroLogin Logo"
              width={28}
              height={32}
              priority
              className="rounded-lg"
            />

            <span className="text-xl font-bold">ZeroLogin</span>
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={install}
              disabled={!installEvent}
              className="ml-2 inline-flex items-center gap-2 rounded-lg border border-[#232B36] px-3 py-2 text-sm text-slate-200 transition hover:border-[#6AA5FF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="size-4" />
              Install App
            </button>
          </div>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
            className="grid size-10 place-items-center rounded-lg text-slate-300 md:hidden"
          >
            {open ? <X /> : <Menu />}
          </button>
        </nav>
        {open && (
          <div className="border-t border-[#232B36] px-4 pb-3 md:hidden">
            <div className="grid gap-1">
              {nav.map((item) => (
                <a
                  key={item.href}
                  onClick={() => setOpen(false)}
                  href={item.href}
                  className={linkClass(item.href)}
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={install}
                disabled={!installEvent}
                className="mt-1 rounded-lg border border-[#232B36] px-3 py-2 text-left text-sm text-slate-200 disabled:opacity-50"
              >
                Install App
              </button>
            </div>
          </div>
        )}
      </header>

      <section
        id="home"
        className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_400px]"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="mb-5 text-sm font-medium text-[#6EE7C8]">
            Privacy-first temporary sharing
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
            Share freely.{" "}
            <span className="text-[#6AA5FF]">Leave no trace.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#94A3B8]">
            ZeroLogin lets you create a secure, temporary space for files,
            images, notes, links, and collaborative ideas — no account required.
          </p>
        </motion.div>
        <div
          id="create"
          className="rounded-2xl border border-[#232B36] bg-[#131A22] p-6 shadow-2xl shadow-black/20"
        >
          <CreateSpaceButton />
        </div>
      </section>
      <section
        id="features"
        className="border-y border-[#232B36] bg-[#131A22]/35 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-[#6EE7C8]">
            Everything you need
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-5xl">
            Built for frictionless collaboration.
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ y: -3 }}
                className="min-h-28 rounded-2xl border border-[#232B36] bg-[#131A22] p-5 shadow-lg shadow-black/10"
              >
                <Sparkles className="size-5 text-[#6AA5FF]" />
                <h3 className="mt-5 font-medium">{feature}</h3>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  Simple, secure, and designed to disappear when you are done.
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      <section id="about" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 rounded-3xl border border-[#232B36] bg-[#131A22] p-7 sm:p-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-[#6EE7C8]">
              About ZeroLogin
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-5xl">
              Privacy isn&apos;t a feature. It&apos;s the starting point.
            </h2>
            <p className="mt-5 leading-7 text-[#94A3B8]">
              We built ZeroLogin for fast, anonymous collaboration. No
              registration, no profiling, and automatic cleanup give you a
              beautifully simple way to share what matters.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Privacy First",
              "Anonymous Sharing",
              "Fast Collaboration",
              "Temporary Secure Spaces",
              "Automatic Cleanup",
              "Beautiful User Experience",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[#232B36] bg-[#0B0F14] p-4"
              >
                <ShieldCheck className="size-5 text-[#6EE7C8]" />
                <p className="mt-3 text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-[#232B36] px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-semibold">Ready to share privately?</h2>
        <a
          href="#create"
          className="mt-6 inline-flex rounded-xl bg-[#4F8CFF] px-5 py-3 text-sm font-semibold transition hover:bg-[#6AA5FF]"
        >
          Create a Space
        </a>
      </section>
      <footer className="border-t border-[#232B36] px-4 py-8 text-center text-sm text-[#94A3B8]">
        © 2026 ZeroLogin. Private sharing, by sneha naik
      </footer>
    </main>
  );
}

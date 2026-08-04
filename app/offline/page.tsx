import Link from "next/link"

export default function OfflinePage() {
  return <main className="grid min-h-screen place-items-center bg-[#0B0F14] px-5 text-center text-[#F5F7FA]"><section className="max-w-sm rounded-2xl border border-[#232B36] bg-[#131A22] p-8 shadow-xl shadow-black/20"><p className="text-sm font-medium text-[#6EE7C8]">ZeroLogin is offline</p><h1 className="mt-3 text-2xl font-semibold">Your connection dropped.</h1><p className="mt-3 text-sm leading-6 text-[#94A3B8]">Reconnect to create or access a space. Previously opened pages may still be available.</p><Link href="/" className="mt-6 inline-flex rounded-lg bg-[#4F8CFF] px-4 py-2.5 text-sm font-semibold hover:bg-[#6AA5FF]">Try again</Link></section></main>
}

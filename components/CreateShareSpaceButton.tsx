"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateSpaceButton() {
  const router = useRouter();
  const [customSpaceId, setCustomSpaceId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validSpaceId = (value: string) =>
    !value ||
    (value.length >= 3 && value.length <= 30 && /^[a-z0-9-_]+$/.test(value));
  const normalizedId = customSpaceId.toLowerCase().replace(/\s+/g, "");
  const validationError =
    normalizedId && !validSpaceId(normalizedId)
      ? "Use 3–30 lowercase letters, numbers, hyphens, or underscores."
      : null;

  const createSpace = async () => {
    if (validationError) return;
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customRoomId: normalizedId }),
        cache: "no-store",
      });
      const data = await response
        .json()
        .catch(() => ({ error: "Unable to create space." }));
      if (!response.ok) throw new Error(data.error);
      router.push(`/${data.roomId}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create space. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="space-y-2">
        <label
          htmlFor="custom-space-url"
          className="text-sm font-medium text-slate-200"
        >
          Custom Space URL <span className="text-slate-500">(Optional)</span>
        </label>
        <div className="flex h-12 items-center rounded-xl border border-[#232B36] bg-[#0B0F14] px-3 transition-colors focus-within:border-[#4F8CFF] focus-within:ring-4 focus-within:ring-[#4F8CFF]/10">
          <span className="select-none font-mono text-sm text-slate-500">
            /
          </span>
          <input
            id="custom-space-url"
            value={customSpaceId}
            onChange={(event) => setCustomSpaceId(event.target.value)}
            placeholder="example-space"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#F5F7FA] outline-none placeholder:text-slate-600"
          />
        </div>
        <p
          className={
            validationError
              ? "text-xs text-[#EF4444]"
              : "text-xs text-[#94A3B8]"
          }
        >
          {validationError ?? "Leave blank to generate a random URL."}
        </p>
      </div>
      <motion.button
        type="button"
        onClick={createSpace}
        disabled={isCreating || !!validationError}
        whileTap={{ scale: 0.98 }}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F8CFF] px-5 text-sm font-semibold text-white shadow-lg shadow-[#4F8CFF]/15 transition-colors hover:bg-[#6AA5FF] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCreating ? (
          <>
            <LoaderCircle className="size-4 animate-spin" /> Creating Space...
          </>
        ) : (
          <>
            Create Space <ArrowRight className="size-4" />
          </>
        )}
      </motion.button>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/10 px-3 py-2 text-sm text-[#fecaca]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

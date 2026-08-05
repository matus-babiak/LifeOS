"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { addTolerance } from "@/app/(app)/tolerancie/actions";

export default function QuickAddTolerance({
  placeholder = "Čo ma práve štve?",
}: {
  placeholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addTolerance(formData);
        formRef.current?.reset();
      }}
      className="flex gap-2"
    >
      <input
        name="text"
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        aria-label="Pridať"
        className="rounded-lg border border-line px-3 text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
      </button>
    </form>
  );
}

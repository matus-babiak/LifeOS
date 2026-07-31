"use client";

import { useRef } from "react";
import { createThought } from "@/app/(app)/myslienky/actions";

export default function NewThoughtForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createThought(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3"
    >
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Čo ti práve prebehlo hlavou?"
        className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        className="self-start rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:text-[#10141a]"
      >
        Uložiť myšlienku
      </button>
    </form>
  );
}

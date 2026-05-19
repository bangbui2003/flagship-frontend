"use client";

import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

function toast({ title, description, variant }: ToastOptions) {
  const message = title ?? "";
  const opts = description ? { description } : undefined;

  if (variant === "destructive") {
    return sonnerToast.error(message, opts);
  }
  return sonnerToast.success(message, opts);
}

function useToast() {
  return { toast };
}

export { useToast, toast };

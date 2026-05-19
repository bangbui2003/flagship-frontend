"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      expand={false}
      closeButton
      gap={8}
      offset={16}
      toastOptions={{
        style: {
          borderRadius: "10px",
          fontSize: "14px",
        },
      }}
    />
  );
}

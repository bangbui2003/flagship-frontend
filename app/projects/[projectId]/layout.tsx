"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  return <AppShell projectId={projectId}>{children}</AppShell>;
}

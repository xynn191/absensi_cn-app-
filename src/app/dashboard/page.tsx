"use client";

import { getAuthSession, getDashboardPathForRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getAuthSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    router.replace(getDashboardPathForRole(session.user.role));
  }, [router]);

  return null;
}

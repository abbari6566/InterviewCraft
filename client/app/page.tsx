"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { me } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        await me();
        router.replace("/dashboard");
      } catch {
        router.replace("/auth/login");
      }
    };

    void checkSession();
  }, [router]);

  return null;
}

"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/signin");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="w-full mt-6 py-[16px] rounded-[16px] bg-soft-green text-[15px] font-bold text-forest"
    >
      Sign out
    </button>
  );
}

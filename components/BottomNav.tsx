"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab = "home" | "board" | "draw" | "profile";

const ACTIVE = "#52B16A";
const IDLE = "#9AA39C";

function HomeIcon({ c }: { c: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}
function BoardIcon({ c }: { c: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12v4a6 6 0 0 1-12 0z" />
      <path d="M9 16h6M12 12v4" />
      <path d="M6 5H3v1a4 4 0 0 0 4 4M18 5h3v1a4 4 0 0 1-4 4" />
    </svg>
  );
}
function DrawIcon({ c }: { c: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18M12 8S9.5 3.5 7 5s2 3 5 3M12 8s2.5-4.5 5-3-2 3-5 3" />
    </svg>
  );
}
function ProfileIcon({ c }: { c: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function NavItem({
  href,
  label,
  active,
  Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  Icon: ({ c }: { c: string }) => JSX.Element;
}) {
  const c = active ? ACTIVE : IDLE;
  return (
    <Link href={href} className="flex flex-col items-center gap-[5px]" style={{ color: c }}>
      <Icon c={c} />
      <span className={`text-[10.5px] ${active ? "font-bold" : "font-semibold"}`}>{label}</span>
    </Link>
  );
}

export default function BottomNav({ active }: { active: Tab }) {
  const router = useRouter();
  return (
    <div className="h-[82px] bg-white border-t border-[#EFF3EF] flex items-center justify-around px-3 flex-none">
      <NavItem href="/home" label="Home" active={active === "home"} Icon={HomeIcon} />
      <NavItem href="/leaderboard" label="Board" active={active === "board"} Icon={BoardIcon} />
      <button
        onClick={() => router.push("/capture")}
        aria-label="Add receipt"
        className="w-14 h-14 rounded-[20px] bg-amber -mt-6 flex items-center justify-center"
        style={{ boxShadow: "0 14px 24px -8px rgba(239,160,60,.8)" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <NavItem href="/draw" label="Draw" active={active === "draw"} Icon={DrawIcon} />
      <NavItem href="/profile" label="Profile" active={active === "profile"} Icon={ProfileIcon} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Award } from "@/lib/queries";

function Box({ tone, title, children }: { tone: "amber" | "blue" | "green"; title: string; children: React.ReactNode }) {
  const styles = {
    amber: { bg: "#FFF6EC", border: "#F6DCB8", text: "#9A7B49" },
    blue: { bg: "#EEF3FB", border: "#CFE0F4", text: "#3A5B8C" },
    green: { bg: "#E5F4E8", border: "#BFE6C9", text: "#2F8C4B" },
  }[tone];
  return (
    <div className="rounded-[18px] px-[16px] py-[14px] mb-4" style={{ background: styles.bg, border: `1.5px solid ${styles.border}` }}>
      <div className="text-[14px] font-extrabold text-ink">{title}</div>
      <div className="mt-[3px] text-[12.5px] leading-[1.5]" style={{ color: styles.text }}>
        {children}
      </div>
    </div>
  );
}

export default function ClaimBanner({ award }: { award: Award }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function claim() {
    setBusy(true);
    await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awardId: award.id }),
    });
    setBusy(false);
    router.refresh();
  }

  const prize = `${award.prize_label}${award.amount ? ` · ${award.amount}` : ""}`;

  if (award.status === "paid") {
    return (
      <Box tone="green" title="🎉 Prize delivered">
        {award.giftcard_code ? (
          <>
            Your gift card code: <span className="font-mono font-bold text-ink">{award.giftcard_code}</span>
          </>
        ) : (
          <>
            Sent to your number <b className="text-ink">{award.payout_phone}</b>. Asante!
          </>
        )}
      </Box>
    );
  }

  if (award.status === "claimed" || award.status === "verified") {
    return (
      <Box tone="blue" title="Claim received ✓">
        We&apos;re verifying and sending <b className="text-ink">{prize}</b> to <b className="text-ink">{award.payout_phone}</b>.
      </Box>
    );
  }

  return (
    <Box tone="amber" title="🎉 You won a prize!">
      <div>
        <b className="text-ink">{prize}</b>. Claim it and we&apos;ll send it to your registered M-Pesa number.
      </div>
      <button
        onClick={claim}
        disabled={busy}
        className="mt-3 w-full rounded-[14px] bg-forest py-[12px] text-[14px] font-bold text-white disabled:opacity-60"
      >
        {busy ? "Claiming…" : "Claim my prize"}
      </button>
    </Box>
  );
}

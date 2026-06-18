"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StatusBar from "@/components/StatusBar";

function Logo() {
  return (
    <div className="flex items-center gap-[11px]">
      <div className="w-[38px] h-[38px] rounded-xl bg-amber flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <span className="text-[21px] font-extrabold text-white tracking-[-.01em]">Risiti</span>
    </div>
  );
}

export default function SignIn() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+255 712 345 678");
  const [name, setName] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  async function sendCode() {
    setError("");
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      setError("Enter a valid phone number.");
      return;
    }
    setStep("otp");
    setTimeout(() => inputs.current[0]?.focus(), 60);
  }

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 4) inputs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  async function verify() {
    const code = digits.join("");
    if (code.length !== 5) {
      setError("Enter the 5-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, code }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace("/home");
      router.refresh();
    } else {
      setError("That code didn't work. Try again.");
    }
  }

  return (
    <div className="app-shell bg-forest flex flex-col min-h-[100dvh]">
      <StatusBar />

      <div className="px-7 pt-[18px] pb-[26px]">
        <Logo />
        <div className="mt-[26px] text-[25px] font-extrabold text-white tracking-[-.02em]">
          Verify your number
        </div>
        <div className="mt-[7px] text-[13.5px] text-white/70">
          {step === "phone" ? "Step 1 of 2 · One number, one fair player." : "Step 2 of 2 · One number, one fair player."}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] px-7 py-8 flex flex-col min-h-0">
        {step === "phone" ? (
          <>
            <label className="text-[13px] font-semibold text-muted-3">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amani Kessy"
              className="mt-2 h-[58px] rounded-2xl bg-mist border-[1.6px] border-mist-border px-4 text-[16px] font-semibold text-ink outline-none focus:border-leaf"
            />
            <label className="mt-5 text-[13px] font-semibold text-muted-3">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="mt-2 h-[58px] rounded-2xl bg-mist border-[1.6px] border-mist-border px-4 text-[16px] font-semibold text-ink outline-none focus:border-leaf"
            />

            {error && <div className="mt-3 text-[12.5px] font-semibold text-coral-text-soft">{error}</div>}

            <div className="flex-1" />

            <Security />
            <button
              onClick={sendCode}
              className="mt-[18px] bg-leaf text-white font-bold text-[16px] text-center py-[18px] rounded-[18px]"
              style={{ boxShadow: "0 14px 26px -12px rgba(82,177,106,.85)" }}
            >
              Send code
            </button>
          </>
        ) : (
          <>
            <div className="text-[13px] font-semibold text-muted-3 leading-[1.55]">
              Enter the 5-digit code we sent to
              <br />
              <span className="text-ink font-bold">{phone}</span>
            </div>

            <div className="flex gap-[11px] mt-6">
              {digits.map((d, i) => {
                const active = !d && digits.findIndex((x) => !x) === i;
                return (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKey(i, e)}
                    inputMode="numeric"
                    maxLength={1}
                    className="flex-1 h-16 rounded-2xl text-center text-[26px] font-extrabold text-ink outline-none"
                    style={
                      active
                        ? { background: "#fff", border: "2.2px solid #52B16A", boxShadow: "0 8px 18px -10px rgba(82,177,106,.6)" }
                        : { background: "#F5F8F5", border: "1.6px solid #E5EBE5" }
                    }
                  />
                );
              })}
            </div>

            <div className="mt-[22px] text-[13px] text-muted">
              Didn&apos;t get it? <span className="text-muted-2 font-bold">Resend in 0:24</span>
            </div>
            {error && <div className="mt-3 text-[12.5px] font-semibold text-coral-text-soft">{error}</div>}

            <div className="flex-1" />

            <Security />
            <button
              onClick={verify}
              disabled={loading}
              className="mt-[18px] bg-leaf text-white font-bold text-[16px] text-center py-[18px] rounded-[18px] disabled:opacity-70"
              style={{ boxShadow: "0 14px 26px -12px rgba(82,177,106,.85)" }}
            >
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Security() {
  return (
    <div className="flex items-start gap-[9px] bg-soft-green rounded-[14px] px-[14px] py-[13px]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52B16A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-px">
        <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <span className="text-[12px] leading-[1.5] text-[#52685A]">
        Your number is only used to keep one person from flooding the leaderboard.
      </span>
    </div>
  );
}

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

/** Five masked digit boxes for entering a PIN. */
function PinInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  autoFocus?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(i: number, raw: string) {
    const d = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = d;
    onChange(next);
    if (d && i < 4) inputs.current[i + 1]?.focus();
  }
  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  return (
    <div className="flex gap-[11px]">
      {value.map((d, i) => {
        const active = !d && value.findIndex((x) => !x) === i;
        return (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            type="password"
            inputMode="numeric"
            maxLength={1}
            autoFocus={autoFocus && i === 0}
            aria-label={`PIN digit ${i + 1}`}
            className="flex-1 min-w-0 h-16 rounded-2xl text-center text-[26px] font-extrabold text-ink outline-none"
            style={
              active
                ? { background: "#fff", border: "2.2px solid #52B16A", boxShadow: "0 8px 18px -10px rgba(82,177,106,.6)" }
                : { background: "#F5F8F5", border: "1.6px solid #E5EBE5" }
            }
          />
        );
      })}
    </div>
  );
}

const EMPTY = ["", "", "", "", ""];

export default function SignIn() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("+255 ");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState<string[]>(EMPTY);
  const [confirm, setConfirm] = useState<string[]>(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function swap(next: "login" | "signup") {
    setMode(next);
    setError("");
    setPin(EMPTY);
    setConfirm(EMPTY);
  }

  async function submit() {
    setError("");
    const cleanPhone = phone.replace(/\s/g, "");
    const pinStr = pin.join("");

    if (!/^\+?\d{9,15}$/.test(cleanPhone)) return setError("Enter a valid phone number.");
    if (pinStr.length !== 5) return setError("Enter your 5-digit PIN.");

    if (mode === "signup") {
      if (username.trim().length < 3) return setError("Pick a username (3+ characters).");
      if (confirm.join("") !== pinStr) return setError("Your PINs don't match.");
    }

    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: cleanPhone, pin: pinStr }),
            })
          : await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: cleanPhone, username: username.trim(), pin: pinStr }),
            });

      if (res.ok) {
        router.replace("/home");
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.status === 423) setError("Too many tries. Wait a few minutes or contact support.");
      else if (data.error === "taken" && data.field === "phone")
        setError("That number already has an account. Sign in instead.");
      else if (data.error === "taken" && data.field === "username") setError("That username is taken.");
      else if (data.error === "invalid_username") setError("Pick a username (3–20 characters).");
      else if (mode === "login") setError("Wrong number or PIN.");
      else setError("Couldn't create your account. Check your details.");
      setLoading(false);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="app-shell bg-forest flex flex-col min-h-[100dvh]">
      <StatusBar />

      <div className="px-7 pt-[18px] pb-[26px]">
        <Logo />
        <div className="mt-[26px] text-[25px] font-extrabold text-white tracking-[-.02em]">
          {mode === "login" ? "Welcome back" : "Join the Rally"}
        </div>
        <div className="mt-[7px] text-[13.5px] text-white/70">One number, one fair player.</div>
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] px-7 py-8 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
        {mode === "signup" && (
          <>
            <label className="text-[13px] font-semibold text-muted-3">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Shown on the leaderboard"
              maxLength={20}
              className="mt-2 h-[58px] rounded-2xl bg-mist border-[1.6px] border-mist-border px-4 text-[16px] font-semibold text-ink outline-none focus:border-leaf"
            />
            <div className="h-5" />
          </>
        )}

        <label className="text-[13px] font-semibold text-muted-3">
          {mode === "signup" ? "Phone number (your M-Pesa number)" : "Phone number"}
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          className="mt-2 h-[58px] rounded-2xl bg-mist border-[1.6px] border-mist-border px-4 text-[16px] font-semibold text-ink outline-none focus:border-leaf"
        />

        <label className="mt-5 text-[13px] font-semibold text-muted-3">
          {mode === "signup" ? "Create a 5-digit PIN" : "Your 5-digit PIN"}
        </label>
        <div className="mt-2">
          <PinInput value={pin} onChange={setPin} />
        </div>

        {mode === "signup" && (
          <>
            <label className="mt-5 text-[13px] font-semibold text-muted-3">Confirm PIN</label>
            <div className="mt-2">
              <PinInput value={confirm} onChange={setConfirm} />
            </div>
          </>
        )}

        {error && <div className="mt-4 text-[12.5px] font-semibold text-coral-text-soft">{error}</div>}

        {mode === "login" && (
          <div className="mt-4 text-[12.5px] text-muted">
            Forgot your PIN? <span className="font-bold text-muted-2">Contact support</span>
          </div>
        )}

        <div className="flex-1 min-h-[18px]" />

        <Security />
        <button
          onClick={submit}
          disabled={loading}
          className="mt-[18px] bg-leaf text-white font-bold text-[16px] text-center py-[18px] rounded-[18px] disabled:opacity-70"
          style={{ boxShadow: "0 14px 26px -12px rgba(82,177,106,.85)" }}
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <button
          onClick={() => swap(mode === "login" ? "signup" : "login")}
          className="mt-[15px] text-center text-[13.5px] text-muted-3"
        >
          {mode === "login" ? (
            <>
              New here? <span className="font-bold text-leaf">Create an account</span>
            </>
          ) : (
            <>
              Already have an account? <span className="font-bold text-leaf">Sign in</span>
            </>
          )}
        </button>
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
        Your number is private — it&apos;s only used to send your prize. Your username is what shows on the board.
      </span>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StatusBar from "@/components/StatusBar";
import { averageHashFromCanvas } from "@/lib/phash";

export default function Capture() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const submittingRef = useRef(false);

  const [status, setStatus] = useState<"scanning" | "no-camera" | "submitting">("scanning");
  const [manual, setManual] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        loop();
      } catch {
        setStatus("no-camera");
      }
    }

    async function loop() {
      const jsQR = (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

      const tick = () => {
        const v = videoRef.current;
        if (!v || v.readyState !== v.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const found = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (found && found.data && !submittingRef.current) {
          const hash = averageHashFromCanvas(canvas);
          submit(found.data, hash);
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    }

    start();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(raw: string, imageHash: string | null) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw, imageHash }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.replace("/signin");
        return;
      }
      if (!res.ok) {
        setError("Couldn't read that. Try again or enter the code.");
        submittingRef.current = false;
        setStatus("scanning");
        return;
      }
      if (data.status === "duplicate") {
        router.replace(`/verified?status=duplicate&reason=${data.reason ?? "code"}`);
      } else {
        router.replace(`/verified?status=counted&code=${encodeURIComponent(data.code)}`);
      }
    } catch {
      setError("Network error. Try again.");
      submittingRef.current = false;
      setStatus("scanning");
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const jsQR = (await import("jsqr")).default;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(data.data, data.width, data.height);
      const hash = averageHashFromCanvas(canvas);
      if (found?.data) submit(found.data, hash);
      else setError("No QR code found in that image.");
    };
    img.src = URL.createObjectURL(file);
  }

  function shutter() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 800;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    import("jsqr").then(({ default: jsQR }) => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(data.data, data.width, data.height);
      const hash = averageHashFromCanvas(canvas);
      if (found?.data) submit(found.data, hash);
      else setError("Hold steady — point the QR inside the frame.");
    });
  }

  return (
    <div className="app-shell bg-forest-deep flex flex-col min-h-[100dvh]">
      <StatusBar />

      <div className="flex items-center px-[22px] pt-3 pb-1">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-[13px] flex items-center justify-center"
          style={{ border: "1.5px solid rgba(255,255,255,.22)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 text-center text-[18px] font-bold text-white -mr-10">Add Receipt</div>
      </div>

      {/* viewfinder */}
      <div
        className="flex-1 relative flex flex-col items-center justify-center"
        style={{ background: "radial-gradient(60% 50% at 50% 42%, rgba(82,177,106,.14), transparent 70%)" }}
      >
        {/* live camera fills behind the frame */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          style={{ display: status === "no-camera" ? "none" : "block" }}
        />
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative w-[224px] h-[268px]">
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />
          <div className="absolute inset-[30px] rounded-lg flex flex-col items-center justify-end p-[18px]" style={{ background: "rgba(255,255,255,.07)" }}>
            <div className="w-[84px] h-[84px] rounded-xl bg-white flex items-center justify-center mb-[10px]">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#16261B" strokeWidth="1.6">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3M20 14v.01M14 20v.01M17 20h.01M20 17v3" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div
            className="absolute left-[30px] right-[30px] top-1/2 h-[2.5px] animate-scan"
            style={{ background: "linear-gradient(90deg,transparent,#52B16A,transparent)", boxShadow: "0 0 12px 2px rgba(82,177,106,.7)" }}
          />
        </div>

        <div className="relative mt-[26px] flex items-center gap-2 px-4 py-[9px] rounded-full" style={{ background: "rgba(0,0,0,.45)" }}>
          <div className="w-2 h-2 rounded-full bg-leaf" />
          <span className="text-[12.5px] font-semibold text-white">
            {status === "submitting" ? "Reading verification code…" : status === "no-camera" ? "Camera off — upload or type the code" : "Looking for the receipt QR…"}
          </span>
        </div>
        {error && (
          <div className="relative mt-3 text-[12.5px] font-semibold text-[#F6C9B2] px-4 text-center">{error}</div>
        )}
      </div>

      {/* controls */}
      <div className="bg-white rounded-t-[32px] px-7 pt-[26px] pb-[30px]">
        {manual ? (
          <div>
            <div className="text-center text-[13px] leading-[1.55] text-muted-3 mb-4">
              Type the verification code printed under the receipt&apos;s QR.
            </div>
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. TRA9F3A22K7X"
              className="w-full h-[58px] rounded-2xl bg-mist border-[1.6px] border-mist-border px-4 text-[16px] font-bold tracking-wide text-ink outline-none focus:border-leaf font-mono"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setManual(false)} className="flex-1 py-[16px] rounded-[16px] bg-soft-green text-[15px] font-bold text-forest">
                Back
              </button>
              <button
                onClick={() => manualCode.trim() && submit(manualCode.trim(), null)}
                className="flex-1 py-[16px] rounded-[16px] bg-leaf text-white text-[15px] font-bold"
              >
                Submit code
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center text-[13px] leading-[1.55] text-muted-3 mb-[22px]">
              Line up the printed receipt so the QR code sits inside the frame. We read its verification code instantly.
            </div>
            <div className="flex items-center justify-between">
              <label className="w-[54px] h-[54px] rounded-2xl bg-soft-green flex items-center justify-center cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C4A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.6" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </label>

              <button onClick={shutter} className="w-20 h-20 rounded-full border-[5px] border-amber flex items-center justify-center">
                <div className="w-[58px] h-[58px] rounded-full bg-amber flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8h2.5L8 6h8l1.5 2H20v11H4z" />
                    <circle cx="12" cy="13" r="3.4" />
                  </svg>
                </div>
              </button>

              <div className="w-[54px] h-[54px] rounded-2xl bg-soft-green flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C4A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
                </svg>
              </div>
            </div>
            <button onClick={() => setManual(true)} className="block w-full text-center mt-[22px] text-[13.5px] font-bold text-leaf">
              Enter code manually
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute w-[42px] h-[42px]";
  const map: Record<string, React.CSSProperties> = {
    tl: { top: 0, left: 0, borderTop: "4px solid #EFA03C", borderLeft: "4px solid #EFA03C", borderRadius: "14px 0 0 0" },
    tr: { top: 0, right: 0, borderTop: "4px solid #EFA03C", borderRight: "4px solid #EFA03C", borderRadius: "0 14px 0 0" },
    bl: { bottom: 0, left: 0, borderBottom: "4px solid #EFA03C", borderLeft: "4px solid #EFA03C", borderRadius: "0 0 0 14px" },
    br: { bottom: 0, right: 0, borderBottom: "4px solid #EFA03C", borderRight: "4px solid #EFA03C", borderRadius: "0 0 14px 0" },
  };
  return <div className={base} style={map[pos]} />;
}

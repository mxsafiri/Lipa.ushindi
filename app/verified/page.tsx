import Link from "next/link";
import { redirect } from "next/navigation";
import StatusBar from "@/components/StatusBar";
import { getSession } from "@/lib/session";
import { prettyCode } from "@/lib/util";

const CONFETTI = [
  { l: 42, t: 24, w: 5, h: 16, c: "#EFA03C", r: 28, round: 2 },
  { l: 96, t: 8, w: 10, h: 10, c: "#52B16A", r: 15, round: 2 },
  { l: 150, t: 40, w: 5, h: 18, c: "#5B8DEF", r: -22, round: 2 },
  { l: 212, t: 14, w: 9, h: 9, c: "#E45C5C", r: 0, round: 50 },
  { l: 268, t: 36, w: 5, h: 16, c: "#F2D24B", r: 40, round: 2 },
  { l: 318, t: 10, w: 9, h: 9, c: "#52B16A", r: -12, round: 2 },
  { l: 66, t: 78, w: 8, h: 8, c: "#5B8DEF", r: 0, round: 50 },
  { l: 300, t: 84, w: 5, h: 15, c: "#EFA03C", r: -30, round: 2 },
  { l: 180, t: 90, w: 8, h: 8, c: "#F2D24B", r: 20, round: 2 },
];

export default function Verified({
  searchParams,
}: {
  searchParams: { status?: string; code?: string; reason?: string };
}) {
  const session = getSession();
  if (!session) redirect("/signin");

  const isDuplicate = searchParams.status === "duplicate";
  const code = searchParams.code ? prettyCode(searchParams.code) : "TRA·9F3A·22K7·X";
  const reason = searchParams.reason === "image" ? "image" : "code";

  return (
    <div className="app-shell bg-forest flex flex-col min-h-[100dvh] relative overflow-hidden">
      <StatusBar />

      <div className="text-center text-white text-[17px] font-bold pt-4 relative z-[3]">
        {isDuplicate ? "Already counted" : "Receipt added"}
      </div>

      {!isDuplicate && (
        <div className="absolute left-0 right-0 z-[1]" style={{ top: 64, height: 150 }}>
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                left: c.l,
                top: c.t,
                width: c.w,
                height: c.h,
                background: c.c,
                borderRadius: c.round,
                transform: `rotate(${c.r}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-[22px] pb-[26px] relative z-[2]">
        <div className="w-full">
          <div className="bg-white rounded-t-[26px] px-[26px] pt-[30px] pb-[22px]">
            <div className="flex justify-center -mt-[6px] mb-4">
              <div
                className="w-[74px] h-[74px] flex items-center justify-center"
                style={{
                  background: isDuplicate ? "#F2885E" : "#EFA03C",
                  boxShadow: "0 0 0 5px #1C4A2A",
                  clipPath:
                    "polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)",
                }}
              >
                {isDuplicate ? (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </div>
            </div>
            <div className="text-center text-[23px] font-extrabold text-ink tracking-[-.02em]">
              {isDuplicate ? "Already Counted" : "Receipt Verified"}
            </div>
            <div className="text-center text-[13.5px] leading-[1.5] text-muted mt-[7px]">
              {isDuplicate ? (
                <>This {reason === "image" ? "photo" : "receipt"} was already submitted.<br />It can only ever count once.</>
              ) : (
                <>This receipt is unique and now counts<br />toward your rank.</>
              )}
            </div>

            {!isDuplicate && (
              <>
                <div className="text-center mt-[22px] text-[11px] font-bold tracking-[.14em] uppercase text-muted-2">
                  Verification code
                </div>
                <div className="mt-[9px] bg-mist border-[1.5px] border-mist-border rounded-[14px] p-[14px] text-center font-mono text-[19px] font-bold text-ink tracking-[.04em]">
                  {code}
                </div>
              </>
            )}
          </div>

          {/* perforation */}
          <div className="relative bg-white h-[30px]">
            <div className="absolute -left-[9px] top-2 w-[18px] h-[18px] rounded-full bg-forest" />
            <div className="absolute -right-[9px] top-2 w-[18px] h-[18px] rounded-full bg-forest" />
            <div className="absolute left-[22px] right-[22px] top-4" style={{ borderTop: "2px dashed #E0E6E0" }} />
          </div>

          <div className="bg-white px-[26px] pt-1 pb-[22px]">
            {/* coral integrity guard */}
            <div className="flex items-start gap-[11px] bg-coral-bg border-[1.5px] border-coral-border rounded-2xl px-[15px] py-[14px]">
              <div className="w-[30px] h-[30px] rounded-[9px] bg-coral flex-none flex items-center justify-center">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <div className="text-[12.5px] font-extrabold text-coral-text">Integrity guard active</div>
                <div className="text-[12px] leading-[1.5] text-coral-text-soft mt-[2px]">
                  Unique code stored &amp; image hash checked — this exact receipt can only ever count once.
                </div>
              </div>
            </div>

            {!isDuplicate && (
              <div className="flex gap-3 mt-4">
                <div className="flex-1 bg-tint-green rounded-[14px] p-[13px] text-center">
                  <div className="text-[20px] font-extrabold text-leaf-deep">+1</div>
                  <div className="text-[11px] font-semibold text-[#52685A] mt-[2px]">unique receipt</div>
                </div>
                <div className="flex-1 bg-tint-green rounded-[14px] p-[13px] text-center">
                  <div className="text-[20px] font-extrabold text-leaf-deep">+1</div>
                  <div className="text-[11px] font-semibold text-[#52685A] mt-[2px]">draw entry</div>
                </div>
              </div>
            )}

            <Link
              href="/home"
              className="block bg-leaf text-white font-bold text-[16px] text-center py-[17px] rounded-[18px] mt-[18px]"
              style={{ boxShadow: "0 14px 26px -12px rgba(82,177,106,.85)" }}
            >
              Done
            </Link>
            <Link href="/capture" className="block text-center mt-[15px] text-[13.5px] font-bold text-leaf">
              Add another receipt
            </Link>
          </div>

          {/* scalloped bottom edge */}
          <div
            className="h-[14px] bg-white"
            style={{
              WebkitMask: "radial-gradient(circle 7px at 7px 14px,transparent 7px,#000 8px)",
              WebkitMaskSize: "14px 14px",
              WebkitMaskRepeat: "repeat-x",
              mask: "radial-gradient(circle 7px at 7px 14px,transparent 7px,#000 8px)",
              maskSize: "14px 14px",
              maskRepeat: "repeat-x",
            }}
          />
        </div>
      </div>
    </div>
  );
}

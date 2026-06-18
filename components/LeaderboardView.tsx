"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import { initials } from "@/lib/util";
import type { LeaderRow, Stats } from "@/lib/queries";

const RANK_BADGE = ["#EFA03C", "#B9C2BC", "#CE8A5B"]; // gold, silver, bronze

export default function LeaderboardView({
  initialRows,
  you,
  stats,
}: {
  initialRows: LeaderRow[];
  you: { name: string };
  stats: Stats;
}) {
  const [range, setRange] = useState<"week" | "all">("week");
  const [rows, setRows] = useState<LeaderRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [cache] = useState<Record<string, LeaderRow[]>>({ week: initialRows });

  async function switchTo(next: "week" | "all") {
    if (next === range) return;
    setRange(next);
    if (cache[next]) {
      setRows(cache[next]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/leaderboard?range=${next}`);
    const data = await res.json();
    cache[next] = data.rows;
    setRows(data.rows);
    setLoading(false);
  }

  return (
    <>
      <div className="px-6 pt-[22px]">
        <div className="flex bg-soft-green rounded-[14px] p-1">
          <button
            onClick={() => switchTo("week")}
            className={`flex-1 text-center text-[13px] font-bold rounded-[11px] py-[10px] ${
              range === "week" ? "text-white bg-leaf" : "text-muted"
            }`}
          >
            This week
          </button>
          <button
            onClick={() => switchTo("all")}
            className={`flex-1 text-center text-[13px] font-bold rounded-[11px] py-[10px] ${
              range === "all" ? "text-white bg-leaf" : "text-muted"
            }`}
          >
            All time
          </button>
        </div>

        {/* your rank highlight */}
        <div className="flex items-center gap-[13px] bg-tint-green border-[1.5px] border-tint-green-border rounded-[18px] px-[15px] py-[13px] mt-4">
          <div className="w-[34px] text-center text-[16px] font-extrabold text-leaf-deep">
            {stats.rank ?? "—"}
          </div>
          <div className="w-[42px] h-[42px] rounded-[13px] bg-leaf flex items-center justify-center text-[15px] font-extrabold text-white">
            {initials(you.name)}
          </div>
          <div className="flex-1">
            <div className="text-[14.5px] font-extrabold text-ink">You · {shortName(you.name)}</div>
            <div className="text-[11.5px] font-semibold text-leaf-deep flex items-center gap-[3px] mt-px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2F8C4B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
              {stats.todayCount > 0 ? `+${stats.todayCount} today` : "keep scanning"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[18px] font-extrabold text-ink">{stats.weekCount}</div>
            <div className="text-[10px] font-semibold text-muted">receipts</div>
          </div>
        </div>

        <div className="text-[11px] font-bold tracking-[.12em] uppercase text-muted-2 mt-5 mb-[6px] mx-[2px]">
          Top collectors
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-2">
        {loading ? (
          <div className="text-center text-[13px] text-muted py-8">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center text-[13px] text-muted py-8">No receipts yet — be the first.</div>
        ) : (
          rows.map((r, i) => {
            const badge = RANK_BADGE[i];
            return (
              <div
                key={r.id}
                className={`flex items-center gap-[13px] py-[11px] ${i < rows.length - 1 ? "border-b border-[#F1F4F1]" : ""}`}
              >
                {badge ? (
                  <div className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center text-[14px] font-extrabold text-white" style={{ background: badge }}>
                    {i + 1}
                  </div>
                ) : (
                  <div className="w-[34px] text-center text-[14px] font-bold text-muted-2">{i + 1}</div>
                )}
                <Avatar name={r.name} bg={r.isYou ? "#52B16A" : undefined} />
                <div className="flex-1">
                  <div className="text-[14.5px] font-bold text-ink">{r.isYou ? `You · ${shortName(r.name)}` : r.name}</div>
                  <div className="text-[11px] text-muted">{r.today > 0 ? `+${r.today} today` : "—"}</div>
                </div>
                <div className="text-right text-[17px] font-extrabold text-ink">{r.receipts}</div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

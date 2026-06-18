import { redirect } from "next/navigation";
import StatusBar from "@/components/StatusBar";
import BottomNav from "@/components/BottomNav";
import LeaderboardView from "@/components/LeaderboardView";
import { getSession } from "@/lib/session";
import { getLeaderboard, getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Leaderboard() {
  const session = getSession();
  if (!session) redirect("/signin");

  const [rows, stats] = await Promise.all([
    getLeaderboard("week", session.id),
    getStats(session.id),
  ]);

  return (
    <div className="app-shell bg-forest flex flex-col min-h-[100dvh]">
      <StatusBar />

      <div className="px-7 pt-[14px] pb-[18px] text-center">
        <div className="text-[18px] font-bold text-white">Leaderboard</div>
        <div className="text-[12.5px] text-white/65 mt-[3px]">More genuine receipts = higher rank</div>
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] flex flex-col min-h-0">
        <LeaderboardView initialRows={rows} you={{ name: session.name }} stats={stats} />
        <BottomNav active="board" />
      </div>
    </div>
  );
}

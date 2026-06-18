import { listAwards, listTopPlayers } from "@/lib/queries";
import AdminConsole from "@/components/AdminConsole";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [awards, players] = await Promise.all([listAwards(), listTopPlayers(10)]);
  return <AdminConsole awards={awards} players={players} />;
}

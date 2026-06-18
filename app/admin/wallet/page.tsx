import { listLiquidityDeposits, totalLiquidity } from "@/lib/queries";
import { ntzsDepositConfigured } from "@/lib/ntzs";
import WalletPortal from "@/components/WalletPortal";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const [deposits, total] = await Promise.all([listLiquidityDeposits(), totalLiquidity()]);
  return <WalletPortal deposits={deposits} total={total} enabled={ntzsDepositConfigured()} />;
}

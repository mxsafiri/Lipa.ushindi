import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default function Index() {
  const session = getSession();
  redirect(session ? "/home" : "/signin");
}

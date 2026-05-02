import { redirect } from "next/navigation";
import { getTodayEditionDate } from "@/lib/db/queries";

export default function Home() {
  const today = getTodayEditionDate();
  redirect(`/edition/${today}`);
}

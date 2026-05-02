import type { Metadata } from "next";
import { EditionView } from "@/components/edition/EditionView";
import { getTodayEditionDate } from "@/lib/db/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Trace — Today",
  description: "Today's edition.",
};

export default function Home() {
  const today = getTodayEditionDate();
  return <EditionView date={today} />;
}

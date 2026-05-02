import type { Metadata } from "next";
import { EditionView } from "@/components/edition/EditionView";
import { getTodayEditionDate } from "@/lib/api";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Trace — Today",
  description: "Today's edition.",
};

export default function Home() {
  return <EditionView date={getTodayEditionDate()} isToday />;
}

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { EditionView } from "@/components/edition/EditionView";
import { getTodayEditionDate } from "@/lib/api";

export const revalidate = 3600;

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `Trace — ${date}`,
    description: `Daily edition for ${date}`,
    openGraph: { title: `Trace — ${date}`, description: "A calm, readable daily edition." },
  };
}

export default async function EditionPage({ params }: Props) {
  const { date } = await params;
  if (date === getTodayEditionDate()) redirect("/");
  return <EditionView date={date} />;
}

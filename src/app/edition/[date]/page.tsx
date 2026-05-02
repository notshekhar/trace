import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { EditionView } from "@/components/edition/EditionView";
import { getEdition, getTodayEditionDate } from "@/lib/db/queries";

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
  const today = getTodayEditionDate();

  if (date === today) redirect("/");

  const edition = await getEdition(date);
  if (!edition || !edition.published) notFound();

  return <EditionView date={date} />;
}

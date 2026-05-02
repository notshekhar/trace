import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ date: string }>;
}

export default async function SectionPage({ params }: Props) {
  const { date } = await params;
  redirect(`/edition/${date}`);
}

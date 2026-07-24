import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchMediaById, fetchReactionCounts } from "@/lib/data/media";
import { getMyReactionEmojis } from "@/lib/actions/getMyReactionEmojis";
import { InterceptedMediaModal } from "@/components/viewer/InterceptedMediaModal";

export default async function InterceptedMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const media = await fetchMediaById(supabase, id);
  if (!media || media.is_hidden) notFound();

  const [initialReactionCounts, initialMyReactionEmojis] = await Promise.all([
    fetchReactionCounts(supabase, id),
    getMyReactionEmojis(id),
  ]);

  return (
    <InterceptedMediaModal
      media={media}
      initialReactionCounts={initialReactionCounts}
      initialMyReactionEmojis={initialMyReactionEmojis}
    />
  );
}

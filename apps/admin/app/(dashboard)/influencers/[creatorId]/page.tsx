import CreatorDetailClient from './CreatorDetailClient';

export default async function CreatorDetailPage({
  params,
}: {
  params: Promise<{ creatorId: string }> | { creatorId: string };
}) {
  const resolved = await params;
  const creatorId = decodeURIComponent(resolved.creatorId || '').trim();

  return <CreatorDetailClient creatorId={creatorId} />;
}

import { redirect } from "next/navigation";

/** Legacy Amazon-only URL — redirect to channel-aware detail. */
export default async function AmazonOrderDetailRedirect(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  redirect(`/orders/channel/${id}`);
}

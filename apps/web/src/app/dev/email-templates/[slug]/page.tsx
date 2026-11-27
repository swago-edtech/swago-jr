import Link from "next/link";
import { notFound } from "next/navigation";
import { render } from "@react-email/render";
import { getEmailTemplate, MSG91_EMAIL } from "@/emails/templates/catalog";

export const dynamic = "force-dynamic";

export default async function EmailTemplatePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getEmailTemplate(slug);
  if (!entry) notFound();

  const html = await render(entry.element);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <Link
              href="/dev/email-templates"
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              ← All templates
            </Link>
            <h1 className="text-lg font-bold text-slate-900">{entry.title}</h1>
            <p className="text-xs text-slate-500">
              {entry.purpose} · MSG91{" "}
              <code className="font-mono">{MSG91_EMAIL.templateId}</code> · {entry.status}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <iframe
            title={entry.title}
            srcDoc={html}
            className="h-[85vh] w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}

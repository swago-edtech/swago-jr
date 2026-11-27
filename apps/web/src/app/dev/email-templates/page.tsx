import Link from "next/link";
import { EMAIL_TEMPLATES, MSG91_EMAIL } from "@/emails/templates/catalog";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  disabled: "bg-amber-50 text-amber-900 border-amber-200",
  manual: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function EmailTemplatesIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Dev preview
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Email templates</h1>
        <p className="mt-2 text-sm text-slate-600">
          All layouts used for outbound MSG91 mail. Open a template to see the rendered HTML.
          Shared MSG91 template id:{" "}
          <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-mono">
            {MSG91_EMAIL.templateId}
          </code>
        </p>

        <ul className="mt-8 space-y-3">
          {EMAIL_TEMPLATES.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/dev/email-templates/${t.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{t.title}</span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone[t.status]}`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{t.purpose}</p>
                <p className="mt-2 font-mono text-[11px] text-slate-400">{t.slug}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

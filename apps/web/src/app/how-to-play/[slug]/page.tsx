import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, HowToPlay } from "@swago/database";
import {
  HOW_TO_PLAY_TITLE_PLACEHOLDER,
  getHowToPlayDescription,
  getHowToPlayDescriptionTemplate,
  getYouTubeEmbedUrl,
  splitHowToPlayDescription,
} from "@swago/utils";

export const dynamic = "force-dynamic";

type LinkedProduct = {
  name: string;
  slug?: string;
  images?: string[];
};

type HowToPlayPageData = {
  title: string;
  description: string;
  youtubeVideoId: string;
  productId: LinkedProduct | null;
};

async function getHowToPlay(slug: string): Promise<HowToPlayPageData | null> {
  try {
    await connectDB();
    const video = await HowToPlay.findOne({ slug: slug.toLowerCase(), isActive: true })
      .populate("productId", "name slug images")
      .lean();
    return video ? JSON.parse(JSON.stringify(video)) : null;
  } catch (error) {
    console.error("Error fetching how-to-play video:", error);
    return null;
  }
}

// Replaces {title} with the game title, optionally wrapped in a highlight span.
function renderWithTitle(text: string, title: string, highlightClassName?: string) {
  return text.split(HOW_TO_PLAY_TITLE_PLACEHOLDER).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && (highlightClassName ? <span className={highlightClassName}>{title}</span> : title)}
      {part}
    </Fragment>
  ));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await getHowToPlay(slug);

  if (!video) {
    return { title: "How to Play | Swago Jr" };
  }

  return {
    title: `${video.title} | How to Play | Swago Jr`,
    description: getHowToPlayDescription(video.description, video.title).replace(/\s+/g, " "),
  };
}

export default async function HowToPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = await getHowToPlay(slug);

  if (!video) {
    notFound();
  }

  const product = video.productId;
  const { heading, body } = splitHowToPlayDescription(getHowToPlayDescriptionTemplate(video.description));

  return (
    <div className="w-full bg-gradient-to-b from-slate-50 to-white">
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <header className="max-w-2xl mx-auto px-2 sm:px-0 mb-8 md:mb-12 text-center text-balance">
          <h1 className="sr-only">{video.title}</h1>
          {heading && (
            <p className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-[hsl(var(--swago-purple))]">
              {renderWithTitle(heading, video.title)}
            </p>
          )}
          {body && (
            <p
              className={`${heading ? "mt-3 md:mt-4" : ""} text-base sm:text-lg md:text-xl font-medium leading-relaxed text-slate-500 whitespace-pre-line`}
            >
              {renderWithTitle(body, video.title, "text-[1.1em] leading-none font-bold text-[hsl(var(--swago-purple))]")}
            </p>
          )}
        </header>

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl md:rounded-3xl bg-black shadow-2xl ring-1 ring-slate-900/10">
          <iframe
            src={getYouTubeEmbedUrl(video.youtubeVideoId)}
            title={`How to play ${video.title}`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        {product?.slug && (
          <div className="mt-8 md:mt-12 flex justify-center">
            <Link
              href={`/product/${product.slug}`}
              className="btn-shine inline-flex items-center gap-3 rounded-full bg-[hsl(var(--swago-purple))] pl-2 pr-6 py-2 text-white font-bold shadow-sm hover:shadow-md transition-shadow"
            >
              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover bg-white"
                />
              )}
              Buy {product.name}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

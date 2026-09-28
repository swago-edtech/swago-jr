import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, HowToPlay } from "@swago/database";
import { getYouTubeEmbedUrl } from "@swago/utils";

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
    description: video.description || `Watch how to play ${video.title}.`,
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

  return (
    <div className="w-full bg-gradient-to-b from-slate-50 to-white">
      <section className="max-w-5xl mx-auto px-4 lg:px-8 py-8 md:py-16">
        <div className="text-center mb-6 md:mb-10">
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[hsl(var(--swago-purple))]">
            How to play
          </p>
          <h1 className="mt-2 text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight">
            {video.title}
          </h1>
        </div>

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

        {video.description && (
          <p className="mt-6 md:mt-8 max-w-3xl mx-auto text-center text-slate-600 text-base md:text-lg leading-relaxed whitespace-pre-line">
            {video.description}
          </p>
        )}

        {product?.slug && (
          <div className="mt-8 md:mt-10 flex justify-center">
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

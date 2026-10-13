import { findCatalogMovieById } from "@/lib/catalog-store";
import { MovieDetailsView } from "./movie-details-view";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const movie = await findCatalogMovieById(id);

  if (!movie) {
    return {
      title: "DhakaFlix • BDIX Media",
      description: "DhakaFlix Media Portal",
    };
  }

  const title = `${movie.title} (${movie.year}) • DhakaFlix`;
  const description =
    movie.overview ||
    `Stream ${movie.title} (${movie.year}) in high quality over DhakaFlix BDIX network.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: movie.backdrop ? [movie.backdrop] : movie.poster ? [movie.poster] : [],
    },
  };
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await findCatalogMovieById(id);

  return <MovieDetailsView initialMovie={movie} id={id} />;
}

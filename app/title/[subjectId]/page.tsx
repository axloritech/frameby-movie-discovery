import MovieDetailsPage from "@/components/movie-details-page";

export default async function TitlePage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  return <MovieDetailsPage subjectId={subjectId} />;
}

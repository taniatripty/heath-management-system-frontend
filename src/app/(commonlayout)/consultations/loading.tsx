export default function ConsultationLoading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      aria-label="Loading consultations"
      role="status"
    >
      <span className="sr-only">Loading consultations...</span>
      <div className="mb-10 h-64 animate-pulse rounded-3xl bg-teal-950/10 sm:h-72" />
      <div className="mb-5 space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
    </main>
  )
}

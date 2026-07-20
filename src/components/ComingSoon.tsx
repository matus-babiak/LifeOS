export default function ComingSoon({
  title,
  description,
  stage,
}: {
  title: string;
  description: string;
  stage: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </header>
      <section className="rounded-2xl border border-dashed border-line p-8 text-center">
        <p className="text-sm text-muted">{description}</p>
        <p className="mt-2 text-xs text-muted">Príde v {stage}.</p>
      </section>
    </div>
  );
}

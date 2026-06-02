type MetricCardProps = {
  label: string;
  value: string;
  caption: string;
};

export function MetricCard({ label, value, caption }: MetricCardProps) {
  return (
    <article className="p-3">
      <p className="text-xs font-semibold uppercase text-moss">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-ink/60">{caption}</p>
    </article>
  );
}

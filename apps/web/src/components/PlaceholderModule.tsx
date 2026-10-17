export function PlaceholderModule({
  description,
  fields,
  title,
}: {
  description: string
  fields: string[]
  title: string
}) {
  return (
    <section className="module-card">
      <p className="eyebrow">Skeleton module</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="placeholder-table">
        {fields.map((field) => (
          <span key={field}>{field}</span>
        ))}
      </div>
    </section>
  )
}

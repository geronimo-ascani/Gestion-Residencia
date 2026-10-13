export function StatCard({ label, value }: { label: string; value: string }) { return <article className="panel stat"><p>{label}</p><strong>{value}</strong></article>; }

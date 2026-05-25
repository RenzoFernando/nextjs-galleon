type VaultStatCardProps = {
  label: string;
  value: string | number;
  description?: string;
};

export function VaultStatCard({ label, value, description }: VaultStatCardProps) {
  return (
    <div className="rounded-3xl border border-[#B39F84]/25 bg-[#1B251D] p-5 shadow-xl shadow-black/20">
      <p className="text-xs uppercase tracking-[0.25em] text-[#B39F84]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#F2E8D5]">{value}</p>
      {description ? <p className="mt-2 text-sm text-[#D6CCA8]/70">{description}</p> : null}
    </div>
  );
}

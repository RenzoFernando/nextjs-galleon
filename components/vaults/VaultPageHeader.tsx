import type { ReactNode } from "react";

type VaultPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  tone?: "blue" | "green" | "red";
};

const toneClasses: Record<NonNullable<VaultPageHeaderProps["tone"]>, string> = {
  blue: "border-[#B39F84]/30 bg-[#19242E]",
  green: "border-[#B39F84]/25 bg-[#1B251D]",
  red: "border-[#7B2E2E]/60 bg-[#2A1111]",
};

export function VaultPageHeader({
  eyebrow,
  title,
  description,
  actions,
  tone = "blue",
}: VaultPageHeaderProps) {
  return (
    <header className={`rounded-3xl p-8 shadow-2xl shadow-black/40 ${toneClasses[tone]}`}>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-[#B39F84]">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl italic text-[#F2E8D5] md:text-5xl">{title}</h1>
          {description ? (
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#D6CCA8]/80">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}

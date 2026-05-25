import type { ReactNode } from "react";

type VaultEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function VaultEmptyState({ title, description, action }: VaultEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-[#B39F84]/40 bg-[#11180F] p-10 text-center">
      <h2 className="font-serif text-2xl italic text-[#F2E8D5]">{title}</h2>
      <p className="mt-3 text-sm text-[#D6CCA8]/70">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

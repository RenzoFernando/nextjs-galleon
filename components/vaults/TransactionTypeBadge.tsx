import type { TransactionType } from "@/types/transaction";

type TransactionTypeBadgeProps = {
  type: TransactionType;
};

const labels: Record<TransactionType, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
};

const classes: Record<TransactionType, string> = {
  income: "border-[#B39F84]/35 bg-[#1B251D] text-[#D6CCA8]",
  expense: "border-[#7B2E2E]/70 bg-[#2A1111] text-[#F2B8B8]",
  transfer: "border-[#B39F84]/35 bg-[#19242E] text-[#D6CCA8]",
};

export function TransactionTypeBadge({ type }: TransactionTypeBadgeProps) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${classes[type]}`}
    >
      {labels[type]}
    </span>
  );
}

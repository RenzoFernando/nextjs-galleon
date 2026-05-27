type VaultSuccessMessageProps = {
  message: string | null;
};

export function VaultSuccessMessage({ message }: VaultSuccessMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#B39F84]/45 bg-[#11180F] px-5 py-4 text-sm text-[#F2E8D5]">
      {message}
    </div>
  );
}

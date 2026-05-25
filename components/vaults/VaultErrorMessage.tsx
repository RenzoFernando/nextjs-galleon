type VaultErrorMessageProps = {
  message: string | null;
};

export function VaultErrorMessage({ message }: VaultErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#7B2E2E] bg-[#2A1111] px-5 py-4 text-sm text-[#F2E8D5]">
      {message}
    </div>
  );
}

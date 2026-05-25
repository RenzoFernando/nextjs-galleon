type VaultLoadingStateProps = {
  message: string;
};

export function VaultLoadingState({ message }: VaultLoadingStateProps) {
  return (
    <div className="rounded-3xl border border-[#B39F84]/20 bg-[#11180F] p-8 text-center text-[#B39F84]">
      {message}
    </div>
  );
}

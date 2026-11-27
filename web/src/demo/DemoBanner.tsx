import { useDemoMode } from "./useDemoMode";

export default function DemoBanner() {
  const demo = useDemoMode();

  if (!demo) {
    return null;
  }

  return (
    <div role="note" aria-label="Public demo notice" className="border-b-2 border-ink bg-pending-surface">
      <p className="mx-auto w-[min(100%-2.5rem,76rem)] py-2 text-sm font-semibold">
        Public demo: synthetic data and simulated payments only. Do not enter real personal or payment details. Data is
        reset regularly.
      </p>
    </div>
  );
}

"use client";

/** Mayorista deshabilitado hasta nuevo aviso. */
export function WholesaleModeToggle() {
  return (
    <button
      type="button"
      disabled
      title="Próximamente"
      className="min-h-11 max-w-[12rem] cursor-not-allowed rounded-full border-2 border-slate-200 bg-slate-100 px-3 py-2 text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-500 sm:max-w-none sm:px-4 sm:text-xs"
    >
      Próximamente: mayorista
    </button>
  );
}

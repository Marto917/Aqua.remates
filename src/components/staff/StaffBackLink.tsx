import Link from "next/link";

type Props = {
  href: string;
  label?: string;
  className?: string;
};

export function StaffBackLink({ href, label = "Volver", className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand/40 hover:bg-brand-muted/40 hover:text-brand-dark ${className}`}
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
      {label}
    </Link>
  );
}

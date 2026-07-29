type Props = {
  until: string;
  reason?: string | null;
};

export function CustomerBannedNotice({ until, reason }: Props) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-900">
      Suspendida hasta{" "}
      {new Date(until).toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
      })}
      {reason ? ` — ${reason}` : ""}
    </div>
  );
}

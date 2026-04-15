import { SetupDemoForm } from "./SetupDemoForm";

export const metadata = {
  title: "Cargar demo — AQUA",
};

export default function SetupDemoPage() {
  const hasSetupSecret = Boolean(process.env.SETUP_SECRET);
  const isProd = process.env.NODE_ENV === "production";
  const needsSecret = isProd || hasSetupSecret;
  const blockedProd = isProd && !hasSetupSecret;

  return (
    <div className="py-8">
      {blockedProd ? (
        <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-semibold">Falta SETUP_SECRET en producción</p>
          <p className="mt-2">
            En Vercel (o tu hosting) creá la variable <code className="rounded bg-white px-1">SETUP_SECRET</code> con un
            valor secreto, guardá y redeploy. Después podrás usar esta página para cargar el catálogo demo.
          </p>
        </div>
      ) : (
        <SetupDemoForm needsSecret={needsSecret} />
      )}
    </div>
  );
}

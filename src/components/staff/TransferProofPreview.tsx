import Link from "next/link";
import Image from "next/image";
import { getPublicAppUrl } from "@/lib/app-url";

type Props = {
  url: string;
  alt?: string;
};

function resolveReceiptUrl(url: string): string {
  const v = url.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  const base = getPublicAppUrl();
  return `${base}${v.startsWith("/") ? v : `/${v}`}`;
}

export function TransferProofPreview({ url, alt = "Comprobante de pago" }: Props) {
  const resolved = resolveReceiptUrl(url);
  const isPdf = /\.pdf($|\?)/i.test(resolved);

  if (isPdf) {
    return (
      <div className="mt-4 space-y-3">
        <a
          href={resolved}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-dark ring-1 ring-amber-200 hover:bg-amber-50"
        >
          Abrir comprobante PDF
        </a>
        <iframe
          title={alt}
          src={resolved}
          className="h-96 w-full max-w-md rounded-lg border border-amber-200 bg-white"
        />
      </div>
    );
  }

  return (
    <a
      href={resolved}
      target="_blank"
      rel="noopener noreferrer"
      className="relative mt-4 block aspect-[4/3] max-w-md overflow-hidden rounded-lg border border-amber-200 bg-white"
    >
      <Image src={resolved} alt={alt} fill className="object-contain" unoptimized />
    </a>
  );
}

import Image from "next/image";
import Link from "next/link";
import { resolveProductImageUrl } from "@/lib/product-images";

type Props = {
  imageUrl: string;
  linkUrl?: string | null;
};

/** Cinta promocional full-width entre filas de productos del home. */
export function HomePromoRibbon({ imageUrl, linkUrl }: Props) {
  const src = resolveProductImageUrl(imageUrl);
  const img = (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-100 shadow-sm">
      <div className="relative aspect-[12/1] min-h-[3.5rem] w-full sm:min-h-[4.5rem]">
        <Image
          src={src}
          alt="Promoción"
          fill
          className="object-contain object-center"
          sizes="100vw"
          unoptimized={src.startsWith("http")}
        />
      </div>
    </div>
  );

  const link = linkUrl?.trim();
  if (link) {
    return (
      <Link href={link} className="block">
        {img}
      </Link>
    );
  }
  return img;
}

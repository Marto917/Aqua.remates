import Image from "next/image";
import Link from "next/link";
import { displayFirstName, resolveUserAvatarUrl } from "@/lib/user-avatar";

type Props = {
  name: string;
  imageUrl: string | null;
};

export function UserProfileChip({ name, imageUrl }: Props) {
  const avatar = resolveUserAvatarUrl(imageUrl);
  const firstName = displayFirstName(name);

  return (
    <Link
      href="/cuenta/perfil"
      className="flex min-h-11 max-w-[8.5rem] items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm transition active:bg-slate-50 sm:max-w-[10rem]"
      title="Mi perfil"
    >
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand-muted">
        <Image
          src={avatar}
          alt=""
          width={36}
          height={36}
          className="h-full w-full object-cover"
          unoptimized={avatar.startsWith("http")}
        />
      </span>
      <span className="truncate text-sm font-semibold text-slate-800">{firstName}</span>
    </Link>
  );
}

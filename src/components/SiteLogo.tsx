import { AquaLogo } from "@/components/AquaLogo";

type Props = {
  showText?: boolean;
  className?: string;
};

export function SiteLogo({ className = "" }: Props) {
  return <AquaLogo className={className} />;
}

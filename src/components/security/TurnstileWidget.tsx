"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef } from "react";

type Props = {
  siteKey: string;
  onToken: (token: string | null) => void;
  className?: string;
};

export function TurnstileWidget({ siteKey, onToken, className }: Props) {
  const ref = useRef<TurnstileInstance>(null);

  return (
    <div className={className}>
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        onSuccess={(token) => onToken(token)}
        onExpire={() => {
          onToken(null);
          ref.current?.reset();
        }}
        onError={() => onToken(null)}
        options={{ theme: "light", size: "normal" }}
      />
    </div>
  );
}

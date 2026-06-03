"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Props = {
  onScan: (code: string) => void;
  disabled?: boolean;
};

export function BarcodePickScanner({ onScan, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [detectorReady] = useState(
    () => typeof window !== "undefined" && "BarcodeDetector" in window,
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setCameraOn(true);

      if (detectorReady) {
        type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => {
          detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
        };
        const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorCtor })
          .BarcodeDetector;
        if (!Detector) return;
        const detector = new Detector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
        });
        let lastCode = "";
        let lastAt = 0;

        const tick = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const code = codes[0]?.rawValue?.trim();
            if (code && (code !== lastCode || Date.now() - lastAt > 1200)) {
              lastCode = code;
              lastAt = Date.now();
              onScan(code);
            }
          } catch {
            /* frame skip */
          }
          rafRef.current = requestAnimationFrame(() => void tick());
        };
        rafRef.current = requestAnimationFrame(() => void tick());
      }
    } catch {
      setError("No se pudo abrir la cámara. Usá el campo manual abajo.");
      setCameraOn(false);
    }
  }

  function stopCamera() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  function submitManual(e: FormEvent) {
    e.preventDefault();
    const code = manual.trim();
    if (!code) return;
    onScan(code);
    setManual("");
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
      <p className="text-sm font-semibold text-sky-900">Escanear código de barra</p>
      <p className="mt-1 text-xs text-sky-800">
        En celular activá la cámara y escaneá cada unidad. Si son 2 iguales, escaneá 2 veces.
      </p>

      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {!cameraOn ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void startCamera()}
            className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Activar cámara
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-900"
          >
            Detener cámara
          </button>
        )}
      </div>

      {cameraOn ? (
        <video
          ref={videoRef}
          className="mt-3 aspect-video w-full max-w-sm rounded-lg border border-sky-200 bg-black object-cover"
          muted
          playsInline
        />
      ) : null}

      {!detectorReady && cameraOn ? (
        <p className="mt-2 text-xs text-amber-800">
          Tu navegador no lee códigos automáticamente. Ingresá el código manualmente.
        </p>
      ) : null}

      <form onSubmit={submitManual} className="mt-3 flex flex-wrap gap-2">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Código manual"
          className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !manual.trim()}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-sky-900 ring-1 ring-sky-300 disabled:opacity-50"
        >
          OK
        </button>
      </form>
    </div>
  );
}

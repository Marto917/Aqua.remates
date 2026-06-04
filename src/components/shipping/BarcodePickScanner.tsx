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

  useEffect(() => {
    if (!cameraOn || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = streamRef.current;
    video.setAttribute("playsinline", "true");
    video.muted = true;

    void video.play().catch(() => {
      setError("No se pudo reproducir la cámara. Probá recargar o usar el código manual.");
    });

    if (!detectorReady) return;

    type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
    };
    const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!Detector) return;

    const detector = new Detector({
      formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
    });
    let lastCode = "";
    let lastAt = 0;

    const tick = async () => {
      if (!videoRef.current || !streamRef.current) return;
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(() => void tick());
        return;
      }
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

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [cameraOn, detectorReady, onScan]);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
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
        Activá la cámara y escaneá cada unidad. Si son 2 iguales, escaneá 2 veces.
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

      <div
        className={`relative mt-3 overflow-hidden rounded-lg border border-sky-200 bg-black ${
          cameraOn ? "aspect-video max-w-sm" : "hidden"
        }`}
      >
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
        {cameraOn && !detectorReady ? (
          <p className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-center text-[10px] text-white">
            Usá ingreso manual si no detecta códigos
          </p>
        ) : null}
      </div>

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

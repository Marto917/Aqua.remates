"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onScan: (code: string) => void;
  disabled?: boolean;
  title?: string;
  hint?: string;
};

export function BarcodeCameraScanner({
  onScan,
  disabled,
  title = "Escanear código de barra",
  hint = "Activá la cámara y apuntá al código. Si no funciona, usá el campo manual.",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const lastScanRef = useRef({ code: "", at: 0 });

  const handleScan = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      const now = Date.now();
      if (trimmed === lastScanRef.current.code && now - lastScanRef.current.at < 1200) return;
      lastScanRef.current = { code: trimmed, at: now };
      onScan(trimmed);
    },
    [onScan],
  );

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
      readerRef.current = null;
    };
  }, []);

  function stopCamera() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  }

  async function startCamera() {
    setError(null);
    const video = videoRef.current;
    if (!video) return;

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      setCameraOn(true);

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        video,
        (result, err) => {
          if (result) {
            handleScan(result.getText());
          } else if (err && (err as { name?: string }).name !== "NotFoundException") {
            console.debug("[barcode]", err);
          }
        },
      );
      controlsRef.current = controls;
    } catch {
      setError("No se pudo abrir la cámara. Revisá permisos o usá el código manual.");
      setCameraOn(false);
      controlsRef.current?.stop();
      controlsRef.current = null;
      readerRef.current = null;
    }
  }

  function submitManual(e: FormEvent) {
    e.preventDefault();
    const code = manual.trim();
    if (!code) return;
    handleScan(code);
    setManual("");
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
      <p className="text-sm font-semibold text-sky-900">{title}</p>
      <p className="mt-1 text-xs text-sky-800">{hint}</p>

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
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
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

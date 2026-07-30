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
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [cameraOn, setCameraOn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const lastScanRef = useRef({ code: "", at: 0 });

  const handleScan = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const now = Date.now();
    if (trimmed === lastScanRef.current.code && now - lastScanRef.current.at < 1200) return;
    lastScanRef.current = { code: trimmed, at: now };
    setLastCode(trimmed);
    onScanRef.current(trimmed);
  }, []);

  const releaseCamera = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* ignore */
    }
    controlsRef.current = null;
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    releaseCamera();
    setCameraOn(false);
    setStarting(false);
  }, [releaseCamera]);

  useEffect(() => {
    return () => {
      releaseCamera();
    };
  }, [releaseCamera]);

  // Arranca recién cuando el <video> ya está visible (si no, en mobile falla).
  useEffect(() => {
    if (!cameraOn) return;

    let cancelled = false;

    async function run() {
      setStarting(true);
      setError(null);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;

      const video = videoRef.current;
      if (!video) {
        setError("No se pudo preparar el visor de cámara.");
        setCameraOn(false);
        setStarting(false);
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Este navegador no permite cámara. Usá Chrome/Safari o el código manual.");
        setCameraOn(false);
        setStarting(false);
        return;
      }

      try {
        const reader = new BrowserMultiFormatReader();

        // Cámara trasera en celulares (ideal para códigos de barra).
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          video,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              handleScan(result.getText());
              return;
            }
            if (err && (err as { name?: string }).name !== "NotFoundException") {
              console.debug("[barcode]", err);
            }
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStarting(false);
      } catch (e) {
        console.error("[barcode] camera start:", e);
        const name =
          e && typeof e === "object" && "name" in e ? String((e as { name: unknown }).name) : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setError("Permiso de cámara denegado. Activá la cámara en el navegador y reintentá.");
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setError("No se encontró una cámara en este dispositivo.");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          setError("La cámara está en uso por otra app. Cerrala y reintentá.");
        } else {
          setError("No se pudo abrir la cámara. Revisá permisos o usá el código manual.");
        }
        releaseCamera();
        setCameraOn(false);
        setStarting(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
      releaseCamera();
    };
  }, [cameraOn, handleScan, releaseCamera]);

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
      {lastCode ? (
        <p className="mt-2 text-xs font-medium text-emerald-800">
          Detectado: <span className="font-mono">{lastCode}</span>
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {!cameraOn ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setError(null);
              setCameraOn(true);
            }}
            className="min-h-11 rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Activar cámara
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="min-h-11 rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-900"
          >
            Detener cámara
          </button>
        )}
      </div>

      <div
        className={`relative mt-3 overflow-hidden rounded-lg border border-sky-200 bg-black ${
          cameraOn ? "aspect-[4/3] w-full max-w-md" : "hidden"
        }`}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />
        {starting ? (
          <p className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
            Abriendo cámara…
          </p>
        ) : null}
      </div>

      <form onSubmit={submitManual} className="mt-3 flex flex-wrap gap-2">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Código manual"
          inputMode="numeric"
          className="min-h-11 min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !manual.trim()}
          className="min-h-11 rounded-full bg-white px-4 py-2 text-sm font-medium text-sky-900 ring-1 ring-sky-300 disabled:opacity-50"
        >
          OK
        </button>
      </form>
    </div>
  );
}

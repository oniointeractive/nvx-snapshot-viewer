import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const defaultUrl =
    (import.meta.env.VITE_STREAM_URL as string | undefined) ?? "";
  const defaultMs = Number(import.meta.env.VITE_REFRESH_MS ?? 1000);

  const search = new URLSearchParams(window.location.search);
  const initialUrl = (search.get("url") || defaultUrl).trim();
  const initialMs = Number(search.get("ms") ?? defaultMs);

  const [baseUrl, setBaseUrl] = useState<string>(initialUrl);
  const [refreshMs, setRefreshMs] = useState<number>(
    isFinite(initialMs) && initialMs > 0 ? initialMs : 1000
  );
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tokenRef = useRef(0);

  const CANVAS_W = 1280;
  const CANVAS_H = 720;

  const buildUrl = (tick: number) => {
    const u = baseUrl;
    if (!u) return "";
    const hasQuery = u.includes("?");
    return `${u}${hasQuery ? "&" : "?"}_=${tick}`;
  };

  const drawImageContain = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const scale = Math.min(cw / iw, ch / ih);
    const dw = Math.round(iw * scale);
    const dh = Math.round(ih * scale);
    const dx = Math.floor((cw - dw) / 2);
    const dy = Math.floor((ch - dh) / 2);

    ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
  };

  useEffect(() => {
    if (!baseUrl) return;
    setError(null);
    tokenRef.current++;
    const myToken = tokenRef.current;

    let tick = 0;
    let stopped = false;
    const loadNext = () => {
      if (stopped || tokenRef.current !== myToken) return;
      tick++;

      const nextUrl = buildUrl(tick);
      if (!nextUrl) return;

      const img = new Image();
      img.decoding = "async";

      const done = () => {
        if (stopped || tokenRef.current !== myToken) return;
        requestAnimationFrame(() => drawImageContain(img));
        setError(null);
        schedule();
      };
      const fail = () => {
        if (stopped || tokenRef.current !== myToken) return;
        setError(
          "Failed to load image. Check URL, firewall, or mixed content."
        );
        schedule();
      };

      img.onload = () => {
        if ("decode" in img) {
          (img.decode() as Promise<void>).then(done).catch(done);
        } else {
          done();
        }
      };
      img.onerror = fail;
      img.src = nextUrl;
    };

    const schedule = () => {
      if (stopped || tokenRef.current !== myToken) return;
      setTimeout(loadNext, refreshMs);
    };

    loadNext();

    return () => {
      stopped = true;
    };
  }, [baseUrl, refreshMs]);

  const onApply = () => {
    const v = (inputRef.current?.value || "").trim();
    if (!v) {
      setError("Please provide a valid snapshot URL.");
      return;
    }
    setError(null);
    setBaseUrl(v);
  };

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>NVX Snapshot Viewer</h1>

      <div style={styles.controls}>
        <input
          ref={inputRef}
          defaultValue={baseUrl}
          placeholder="http://192.168.1.213:8080/streams/stream1"
          style={styles.input}
        />
        <input
          type="number"
          min={250}
          step={250}
          value={refreshMs}
          onChange={(e) =>
            setRefreshMs(Math.max(250, Number(e.target.value) || 1000))
          }
          title="Refresh interval (ms)"
          style={styles.number}
        />
        <button onClick={onApply} style={styles.button}>
          Apply
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={styles.canvas}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 920,
    margin: "0 auto",
    padding: 24,
    fontFamily: "system-ui, sans-serif",
  },
  title: { margin: "0 0 16px 0", fontWeight: 600 },
  controls: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  input: { flex: 1, minWidth: 360, padding: "8px 12px" },
  number: { width: 120, padding: "8px 12px" },
  button: { padding: "8px 14px", cursor: "pointer" },
  error: { color: "#b00020", marginBottom: 12 },
  canvasWrap: {
    width: "100%",
    maxWidth: 900,
    background: "#111",
    borderRadius: 8,
    border: "1px solid #333",
  },
  canvas: {
    width: "100%",
    height: "auto",
    aspectRatio: "16/9",
    display: "block",
  },
};

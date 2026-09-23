import { forwardRef, useImperativeHandle, useRef, type PointerEvent } from "react";

export type SignaturePadHandle = {
  getDataUrl: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
};

// Unterschrift per Finger/Stift/Maus (Pointer Events decken alles ab — wichtig fürs iPad).
// Interne Canvas-Auflösung ist fix, die Darstellung skaliert per CSS auf die Container-Breite;
// getPos() rechnet die Klick-/Touch-Koordinaten entsprechend zurück.
export const SignaturePad = forwardRef<SignaturePadHandle, { height?: number }>(function SignaturePad({ height = 160 }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useImperativeHandle(ref, () => ({
    getDataUrl: () => {
      if (!hasDrawn.current || !canvasRef.current) return null;
      return canvasRef.current.toDataURL("image/png");
    },
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawn.current = false;
    },
    isEmpty: () => !hasDrawn.current,
  }));

  function getPos(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(e: PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPoint.current = getPos(e);
  }

  function handlePointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPoint.current) return;
    const point = getPos(e);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint.current = point;
    hasDrawn.current = true;
  }

  function handlePointerUp() {
    drawing.current = false;
    lastPoint.current = null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={height * 2}
      style={{
        width: "100%",
        height,
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        touchAction: "none",
        background: "#fff",
        display: "block",
        cursor: "crosshair",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
});

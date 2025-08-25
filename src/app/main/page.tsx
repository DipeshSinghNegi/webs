"use client";

import React, { useEffect, useRef, useState } from "react";
import ImageDisplay from "../../components/ImageDisplay";

type CurrentPayload = {
  url: string;
  w?: number;
  h?: number;
  mime?: string;
  seq: number;
  serverTime?: number;
};

const POLL_MS = 8000;

export default function MainPage() {
  const [current, setCurrent] = useState<CurrentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const highestSeqRef = useRef<number>(-1);
  const pollTimer = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initial() {
      try {
        const res = await fetch("/api/current", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as CurrentPayload;
          if (!cancelled) {
            highestSeqRef.current = data.seq ?? 0;
            setCurrent(data);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    initial();

    // Optional raw WebSocket (set NEXT_PUBLIC_WS_URL to enable)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // If your server expects subscription message, send it:
          // ws.send(JSON.stringify({ type: "subscribe", channel: "main" }));
        };
        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            // Expect: { type:"image:updated", payload:{ url, seq, ... } }
            if (msg?.type === "image:updated" && msg?.payload) {
              const incoming = msg.payload as CurrentPayload;
              if (incoming.seq > highestSeqRef.current) {
                highestSeqRef.current = incoming.seq;
                setCurrent(incoming);
              }
            }
          } catch {}
        };
        ws.onclose = () => {};
        ws.onerror = () => {};
      } catch {}
    }

    // Polling fallback (and general safety net)
    function startPolling() {
      stopPolling();
      pollTimer.current = window.setInterval(async () => {
        try {
          const res = await fetch("/api/current", { cache: "no-store" });
          if (!res.ok) return;
          const data = (await res.json()) as CurrentPayload;
          if (data.seq > highestSeqRef.current) {
            highestSeqRef.current = data.seq;
            setCurrent(data);
          }
        } catch {}
      }, POLL_MS) as unknown as number;
    }
    function stopPolling() {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    }
    startPolling();

    return () => {
      cancelled = true;
      stopPolling();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#0b0f14] to-[#0f1728]">
      {/* Top bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20
                      backdrop-blur-md bg-white/5 border border-white/10
                      rounded-2xl px-4 py-2 text-sm text-gray-300">
        Main Display · seq: <span className="tabular-nums">{current?.seq ?? 0}</span>
        {current?.serverTime ? (
          <> · {new Date(current.serverTime).toLocaleString()}</>
        ) : null}
      </div>

      {/* Content */}
      <div className="px-4 pt-20 pb-16 max-w-7xl mx-auto">
        <div className="aspect-video w-full">
          <ImageDisplay
            src={current?.url}
            version={current?.seq}
            alt="Current uploaded"
            aspectClassName="aspect-video"
            objectFit="contain"
            placeholderText={loading ? "Loading…" : "No image yet—waiting for the first upload…"}
          />
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          This screen auto-updates when a new image is published. If realtime is unavailable,
          it polls every {POLL_MS / 1000}s.
        </p>
      </div>
    </div>
  );
}

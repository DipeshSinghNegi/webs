"use client";

import React, { useEffect, useMemo, useState } from "react";

export type ImageDisplayProps = {
  src?: string | null;
  version?: number | string;      // cache-buster (e.g., seq)
  alt?: string;
  objectFit?: "contain" | "cover";
  aspectClassName?: string;       // e.g., "aspect-video", "aspect-square"
  className?: string;
  imgClassName?: string;
  placeholderText?: string;
  onReady?: () => void;
};

export default function ImageDisplay({
  src,
  version,
  alt = "Image",
  objectFit = "contain",
  aspectClassName = "aspect-video",
  className = "",
  imgClassName = "",
  placeholderText = "No image yet—waiting for the first upload…",
  onReady,
}: ImageDisplayProps) {
  const [loading, setLoading] = useState<boolean>(!!src);
  const [errored, setErrored] = useState<boolean>(false);

  const cacheBustedSrc = useMemo(() => {
    if (!src) return undefined;
    if (version === undefined || version === null || version === "") return src;
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}v=${encodeURIComponent(String(version))}`;
  }, [src, version]);

  useEffect(() => {
    setErrored(false);
    setLoading(!!cacheBustedSrc);
  }, [cacheBustedSrc]);

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-2xl",
        "border border-white/10 bg-white/5 backdrop-blur-sm",
        aspectClassName,
        className,
      ].join(" ")}
    >
      {(loading && !errored) && (
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      )}

      {!cacheBustedSrc && (
        <div className="absolute inset-0 grid place-items-center text-gray-400 text-sm px-4 text-center">
          {placeholderText}
        </div>
      )}

      {errored && cacheBustedSrc && (
        <div className="absolute inset-0 grid place-items-center text-red-300 text-sm px-4 text-center">
          Failed to load image.
        </div>
      )}

      {cacheBustedSrc && !errored && (
        <img
          src={cacheBustedSrc}
          alt={alt}
          onLoad={() => {
            setLoading(false);
            onReady?.();
          }}
          onError={() => {
            setLoading(false);
            setErrored(true);
          }}
          className={[
            "absolute inset-0 h-full w-full transition-opacity duration-300",
            objectFit === "cover" ? "object-cover" : "object-contain",
            loading ? "opacity-0" : "opacity-100",
            imgClassName,
          ].join(" ")}
          draggable={false}
        />
      )}
    </div>
  );
}

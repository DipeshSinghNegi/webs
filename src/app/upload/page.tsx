"use client";

import React, { useState } from "react";
import ImageDisplay from "../../components/ImageDisplay";

type UploadUrlResponse = {
  uploadUrl: string;  // pre-signed PUT URL
  publicUrl: string;  // final public URL of the uploaded object
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "signing" | "uploading" | "publishing" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const isImage = (f: File | null) => !!f && /^image\/(png|jpe?g|webp|avif)$/i.test(f.type);

  async function getImageDims(file: File): Promise<{ width: number; height: number }> {
    const url = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  async function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(null);
    setPreview(null);
    setMessage("");
    setStatus("idle");

    if (!f) return;
    if (!isImage(f)) {
      setMessage("Please choose a PNG, JPG/JPEG, WebP, or AVIF image.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setMessage("Max file size is 10MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function onUpload() {
    if (!file) return;
    try {
      setStatus("signing");
      setMessage("Requesting signed URL…");

      // 1) Get a pre-signed URL from your backend
      const signRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mime: file.type }),
      });
      if (!signRes.ok) throw new Error(`Sign URL failed (${signRes.status})`);
      const { uploadUrl, publicUrl } = (await signRes.json()) as UploadUrlResponse;

      // 2) Upload to storage
      setStatus("uploading");
      setMessage("Uploading…");
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);

      // 3) Publish as current image
      setStatus("publishing");
      setMessage("Publishing…");
      const { width, height } = await getImageDims(file);

      const pubRes = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicUrl, width, height, mime: file.type }),
      });
      if (!pubRes.ok) throw new Error(`Publish failed (${pubRes.status})`);

      setStatus("done");
      setMessage("Published! The main screen will update.");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err?.message ?? "Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold mb-4">Upload a photo</h1>

        <label htmlFor="file" className="block w-full cursor-pointer">
          <div className="rounded-xl border border-dashed border-white/15 hover:border-blue-400/40 transition-colors">
            <ImageDisplay
              src={preview ?? undefined}
              alt="Preview"
              aspectClassName="aspect-video"
              placeholderText="Click to choose an image (PNG, JPG, WebP, AVIF · up to 10MB)"
            />
          </div>
        </label>
        <input
          id="file"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
          className="hidden"
          onChange={onSelectFile}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onUpload}
            disabled={!file || status === "signing" || status === "uploading" || status === "publishing"}
            className="col-span-2 sm:col-span-1 rounded-xl bg-blue-600 hover:bg-blue-500 transition px-4 py-2 text-white disabled:opacity-50"
          >
            {status === "signing"
              ? "Preparing…"
              : status === "uploading"
              ? "Uploading…"
              : status === "publishing"
              ? "Publishing…"
              : "Upload & Publish"}
          </button>

          {file && (
            <button
              onClick={() => { setFile(null); setPreview(null); setMessage(""); setStatus("idle"); }}
              className="col-span-2 sm:col-span-1 rounded-xl border border-white/10 px-4 py-2 text-gray-200 hover:bg-white/5 transition"
            >
              Reset
            </button>
          )}
        </div>

        <p className="mt-3 text-sm">
          <span className={`inline-flex items-center rounded-full px-3 py-1 border
            ${status === "error" ? "bg-red-500/15 text-red-300 border-red-400/20"
              : status === "done" ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/20"
              : "bg-white/5 text-gray-300 border-white/10"}`}>
            {message || "Waiting for a file…"}
          </span>
        </p>

        <p className="mt-6 text-xs text-gray-400">
          After publishing, the <strong>Main</strong> screen will switch to your image until someone else uploads.
        </p>
      </div>
    </div>
  );
}

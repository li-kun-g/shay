"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

interface Props {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, onCropComplete, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleCropComplete = useCallback(
    async () => {
      try {
        const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
        onCropComplete(croppedBlob);
      } catch (e) {
        console.error("Error cropping image:", e);
      }
    },
    [croppedAreaPixels, image, onCropComplete]
  );

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black">
        <h2 className="text-white font-semibold">Edit Photo</h2>
      </div>

      {/* Cropper Area */}
      <div className="relative flex-1 bg-zinc-950">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          onZoomChange={setZoom}
        />
      </div>

      {/* Footer Controls */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-6 pb-10 space-y-6">
        {/* Slider */}
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-sm">−</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <span className="text-zinc-500 text-sm">+</span>
        </div>
        
        <div className="flex justify-between gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-zinc-700 font-medium transition active:scale-95 hover:bg-zinc-800"
            style={{ color: "white" }} // Force white text
          >
            Cancel
          </button>
          
          <button
            onClick={handleCropComplete}
            className="flex-1 py-3 px-4 rounded-xl font-bold transition active:scale-95 shadow-lg"
            style={{ 
              backgroundColor: "white", 
              color: "black", // Force black text on white background
              opacity: 1 
            }}
          >
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to process the crop
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((res) => (image.onload = res));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context failed");

  canvas.width = 500;
  canvas.height = 500;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    500,
    500
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Canvas is empty"));
      resolve(blob);
    }, "image/jpeg", 0.85);
  });
}
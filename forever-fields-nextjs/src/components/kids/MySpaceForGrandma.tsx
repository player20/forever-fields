"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button, Card, CardContent, Textarea } from "@/components/ui";

interface Creation {
  id: string;
  type: "drawing" | "letter" | "voiceMessage";
  content: string; // base64 for drawing, text for letter, URL for voice
  createdAt: string;
  creatorName: string;
  creatorAge?: number;
}

interface MySpaceForGrandmaProps {
  ancestorName: string;
  ancestorPhoto?: string;
  creatorName: string;
  creations?: Creation[];
  onSave?: (creation: Omit<Creation, "id" | "createdAt">) => void;
}

type Mode = "menu" | "draw" | "letter" | "voice" | "gallery";

export function MySpaceForGrandma({
  ancestorName,
  ancestorPhoto,
  creatorName,
  creations = [],
  onSave,
}: MySpaceForGrandmaProps) {
  const [mode, setMode] = useState<Mode>("menu");
  const [letterText, setLetterText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // Canvas refs for drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#a7c9a2"); // sage
  const [brushSize, setBrushSize] = useState(5);

  // Initialize canvas
  useEffect(() => {
    if (mode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [mode]);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    // Scale for canvas resolution
    x = (x / rect.width) * canvas.width;
    y = (y / rect.height) * canvas.height;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const saveDrawing = () => {
    if (canvasRef.current && onSave) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSave({
        type: "drawing",
        content: dataUrl,
        creatorName,
      });
      setMode("menu");
    }
  };

  const saveLetter = () => {
    if (letterText.trim() && onSave) {
      onSave({
        type: "letter",
        content: letterText,
        creatorName,
      });
      setLetterText("");
      setMode("menu");
    }
  };

  const colors = [
    "#a7c9a2", // sage
    "#4a6741", // sage-dark
    "#f0e6d3", // cream
    "#d4af37", // gold
    "#5d4e6d", // twilight
    "#e74c3c", // red
    "#3498db", // blue
    "#f39c12", // orange
    "#9b59b6", // purple
    "#1abc9c", // teal
    "#000000", // black
  ];

  // Menu view
  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sage-pale to-cream p-4">
        <div className="max-w-md mx-auto pt-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-sage">
              {ancestorPhoto ? (
                <Image src={ancestorPhoto} alt={ancestorName} width={80} height={80} className="w-full h-full object-cover" unoptimized={ancestorPhoto.startsWith("blob:") || ancestorPhoto.startsWith("data:")} />
              ) : (
                <div className="w-full h-full bg-sage-light flex items-center justify-center text-3xl">
                  ❤️
                </div>
              )}
            </div>
            <h1 className="font-display text-3xl text-sage-dark">
              My Space for {ancestorName}
            </h1>
            <p className="text-gray-600">
              Create something special to remember them
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <button
              onClick={() => setMode("draw")}
              className="w-full p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">🎨</span>
                <div>
                  <p className="font-medium text-sage-dark text-lg">Draw a Picture</p>
                  <p className="text-sm text-gray-500">
                    Draw something for {ancestorName}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("letter")}
              className="w-full p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">✉️</span>
                <div>
                  <p className="font-medium text-sage-dark text-lg">Write a Letter</p>
                  <p className="text-sm text-gray-500">
                    Tell {ancestorName} something special
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("voice")}
              className="w-full p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">🎤</span>
                <div>
                  <p className="font-medium text-sage-dark text-lg">Record a Message</p>
                  <p className="text-sm text-gray-500">
                    Say something to {ancestorName}
                  </p>
                </div>
              </div>
            </button>

            {creations.length > 0 && (
              <button
                onClick={() => setMode("gallery")}
                className="w-full p-6 bg-sage-pale rounded-2xl hover:bg-sage-light transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🖼️</span>
                  <div>
                    <p className="font-medium text-sage-dark text-lg">My Gallery</p>
                    <p className="text-sm text-gray-500">
                      See everything I've made ({creations.length})
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Drawing mode
  if (mode === "draw") {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMode("menu")}
              className="text-gray-500 hover:text-sage"
            >
              ← Back
            </button>
            <h2 className="font-display text-xl text-sage-dark">
              Draw for {ancestorName}
            </h2>
            <Button size="sm" onClick={saveDrawing}>
              Save
            </Button>
          </div>

          {/* Canvas */}
          <div className="border-4 border-sage rounded-xl overflow-hidden mb-4 touch-none">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full bg-white cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onMouseMove={draw}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
            />
          </div>

          {/* Color palette */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setBrushColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  brushColor === color
                    ? "border-sage-dark scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Brush size */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-sm text-gray-500">Size:</span>
            {[3, 5, 10, 20].map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  brushSize === size ? "bg-sage-pale" : ""
                }`}
              >
                <div
                  className="rounded-full bg-gray-600"
                  style={{ width: size, height: size }}
                />
              </button>
            ))}
          </div>

          {/* Clear button */}
          <div className="text-center">
            <button
              onClick={clearCanvas}
              className="text-sm text-gray-500 hover:text-error"
            >
              🗑️ Clear drawing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Letter mode
  if (mode === "letter") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <div className="max-w-lg mx-auto pt-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setMode("menu")}
              className="text-gray-500 hover:text-sage"
            >
              ← Back
            </button>
            <h2 className="font-display text-xl text-sage-dark">
              Letter to {ancestorName}
            </h2>
            <Button size="sm" onClick={saveLetter} disabled={!letterText.trim()}>
              Send
            </Button>
          </div>

          {/* Letter paper */}
          <Card className="bg-white shadow-lg">
            <CardContent className="py-6">
              <p className="text-gray-500 mb-4">Dear {ancestorName},</p>
              <Textarea
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                placeholder="Write your message here..."
                className="min-h-[300px] border-0 focus:ring-0 resize-none text-lg leading-relaxed"
                style={{ fontFamily: "'Patrick Hand', cursive, sans-serif" }}
              />
              <div className="text-right mt-4 text-gray-500">
                <p>Love,</p>
                <p className="font-medium text-sage-dark">{creatorName}</p>
              </div>
            </CardContent>
          </Card>

          {/* Prompts */}
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-3">Need ideas? Try writing about:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "I miss you because...",
                "My favorite memory with you is...",
                "I wish I could tell you...",
                "You would be proud that I...",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setLetterText(prompt)}
                  className="text-sm px-3 py-1 bg-sage-pale text-sage-dark rounded-full hover:bg-sage-light transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Voice mode
  if (mode === "voice") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <div className="max-w-md mx-auto pt-8 text-center">
          {/* Header */}
          <button
            onClick={() => setMode("menu")}
            className="text-gray-500 hover:text-sage mb-8 block"
          >
            ← Back
          </button>

          <h2 className="font-display text-2xl text-sage-dark mb-4">
            Record a Message for {ancestorName}
          </h2>
          <p className="text-gray-600 mb-8">
            Tap the button and speak from your heart
          </p>

          {/* Record button */}
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 transition-all ${
              isRecording
                ? "bg-error animate-pulse"
                : "bg-sage hover:bg-sage-dark"
            }`}
          >
            <span className="text-4xl text-white">
              {isRecording ? "⏹️" : "🎙️"}
            </span>
          </button>

          <p className="text-gray-500">
            {isRecording
              ? "Recording... tap to stop"
              : "Tap to start recording"}
          </p>

          {/* Coming soon notice */}
          <div className="mt-12 p-4 bg-sage-pale/50 rounded-lg">
            <p className="text-sm text-gray-600">
              🚧 Voice recording coming soon! For now, try writing a letter instead.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Gallery mode
  if (mode === "gallery") {
    return (
      <div className="min-h-screen bg-cream p-4">
        <div className="max-w-lg mx-auto pt-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setMode("menu")}
              className="text-gray-500 hover:text-sage"
            >
              ← Back
            </button>
            <h2 className="font-display text-xl text-sage-dark">
              My Gallery
            </h2>
            <div />
          </div>

          {/* Creations */}
          {creations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <span className="text-5xl block mb-4">🖼️</span>
                <p className="text-gray-600">
                  Nothing here yet. Create something!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {creations.map((creation) => (
                <Card key={creation.id} className="overflow-hidden">
                  {creation.type === "drawing" && (
                    <Image
                      src={creation.content}
                      alt="Drawing"
                      width={192}
                      height={128}
                      className="w-full h-32 object-cover"
                      unoptimized={creation.content.startsWith("blob:") || creation.content.startsWith("data:")}
                    />
                  )}
                  {creation.type === "letter" && (
                    <div className="h-32 p-3 overflow-hidden">
                      <p className="text-sm text-gray-600 line-clamp-4">
                        {creation.content}
                      </p>
                    </div>
                  )}
                  {creation.type === "voiceMessage" && (
                    <div className="h-32 flex items-center justify-center bg-sage-pale">
                      <span className="text-3xl">🎤</span>
                    </div>
                  )}
                  <CardContent className="py-2">
                    <p className="text-xs text-gray-500">
                      By {creation.creatorName}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

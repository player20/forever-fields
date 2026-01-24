"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

interface PhotoAnalysis {
  caption?: string;
  estimatedDecade?: string;
  setting?: string;
  mood?: string;
  numberOfPeople?: number;
  suggestions?: string[];
}

interface PhotoEnhancerProps {
  onSave?: (enhancedUrl: string, analysis: PhotoAnalysis) => void;
  onCancel?: () => void;
}

type EnhancementType = "colorize" | "restore" | "both";
type ProcessingStep = "upload" | "enhance" | "review";

export function PhotoEnhancer({ onSave, onCancel }: PhotoEnhancerProps) {
  const [step, setStep] = useState<ProcessingStep>("upload");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [enhancementType, setEnhancementType] = useState<EnhancementType>("colorize");
  const [_isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create object URL for preview
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setError(null);

    // Convert to base64 for API
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];

      // Auto-analyze the photo
      try {
        const response = await fetch("/api/ai/photo-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, analysisType: "caption" }),
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysis(data);
        }
      } catch {
        console.log("Analysis skipped");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle URL input
  const _handleUrlInput = useCallback(async (url: string) => {
    setOriginalUrl(url);
    setError(null);

    // Analyze the photo
    try {
      const response = await fetch("/api/ai/photo-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url, analysisType: "caption" }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch {
      console.log("Analysis skipped");
    }
  }, []);

  // Process enhancement
  const handleEnhance = useCallback(async () => {
    if (!originalUrl) return;

    setIsProcessing(true);
    setError(null);
    setStep("enhance");

    try {
      let resultUrl = originalUrl;

      // Run colorization if selected
      if (enhancementType === "colorize" || enhancementType === "both") {
        const colorizeResponse = await fetch("/api/ai/photo-colorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: originalUrl, renderFactor: 35 }),
        });

        if (!colorizeResponse.ok) {
          throw new Error("Colorization failed");
        }

        const colorizeData = await colorizeResponse.json();
        resultUrl = colorizeData.colorizedUrl || resultUrl;
      }

      // Run face restoration if selected
      if (enhancementType === "restore" || enhancementType === "both") {
        const restoreResponse = await fetch("/api/ai/photo-restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: resultUrl, scale: 2 }),
        });

        if (!restoreResponse.ok) {
          throw new Error("Face restoration failed");
        }

        const restoreData = await restoreResponse.json();
        resultUrl = restoreData.restoredUrl || resultUrl;
      }

      setEnhancedUrl(resultUrl);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enhancement failed");
      setStep("upload");
    } finally {
      setIsProcessing(false);
    }
  }, [originalUrl, enhancementType]);

  // Save enhanced photo
  const handleSave = useCallback(() => {
    if (enhancedUrl && analysis) {
      onSave?.(enhancedUrl, analysis);
    }
  }, [enhancedUrl, analysis, onSave]);

  // Reset to start
  const handleReset = useCallback(() => {
    setStep("upload");
    setOriginalUrl(null);
    setEnhancedUrl(null);
    setAnalysis(null);
    setError(null);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo Enhancer</CardTitle>
        <CardDescription>
          Restore and colorize old family photos using AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* File Upload */}
            <div className="border-2 border-dashed border-sage-light rounded-lg p-8 text-center hover:border-sage transition-colors">
              <div className="text-5xl mb-4">📷</div>
              <p className="text-gray-600 mb-4">
                Upload an old photo to enhance
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="inline-block">
                <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-sage rounded-xl cursor-pointer hover:bg-sage/10 transition-colors">
                  Choose Photo
                </span>
              </label>
            </div>

            {/* Preview */}
            {originalUrl && (
              <div className="space-y-4">
                <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={originalUrl}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>

                {/* AI Analysis */}
                {analysis && (
                  <div className="bg-sage-pale/30 rounded-lg p-4 space-y-2">
                    <h3 className="font-medium text-sage-dark">AI Analysis</h3>
                    {analysis.caption && (
                      <p className="text-gray-600 italic">"{analysis.caption}"</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm">
                      {analysis.estimatedDecade && (
                        <span className="bg-white px-2 py-1 rounded">
                          Estimated: {analysis.estimatedDecade}
                        </span>
                      )}
                      {analysis.setting && (
                        <span className="bg-white px-2 py-1 rounded">
                          {analysis.setting}
                        </span>
                      )}
                      {analysis.mood && (
                        <span className="bg-white px-2 py-1 rounded">
                          Mood: {analysis.mood}
                        </span>
                      )}
                      {analysis.numberOfPeople && (
                        <span className="bg-white px-2 py-1 rounded">
                          {analysis.numberOfPeople} {analysis.numberOfPeople === 1 ? "person" : "people"}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhancement Options */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sage-dark">Enhancement Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setEnhancementType("colorize")}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        enhancementType === "colorize"
                          ? "border-sage bg-sage-pale/50"
                          : "border-gray-200 hover:border-sage-light"
                      }`}
                    >
                      <span className="text-2xl block mb-1">🎨</span>
                      <span className="font-medium">Colorize</span>
                      <p className="text-xs text-gray-500">
                        Add color to black & white photos
                      </p>
                    </button>

                    <button
                      onClick={() => setEnhancementType("restore")}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        enhancementType === "restore"
                          ? "border-sage bg-sage-pale/50"
                          : "border-gray-200 hover:border-sage-light"
                      }`}
                    >
                      <span className="text-2xl block mb-1">✨</span>
                      <span className="font-medium">Restore Faces</span>
                      <p className="text-xs text-gray-500">
                        Enhance blurry or damaged faces
                      </p>
                    </button>

                    <button
                      onClick={() => setEnhancementType("both")}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        enhancementType === "both"
                          ? "border-sage bg-sage-pale/50"
                          : "border-gray-200 hover:border-sage-light"
                      }`}
                    >
                      <span className="text-2xl block mb-1">🌟</span>
                      <span className="font-medium">Full Enhancement</span>
                      <p className="text-xs text-gray-500">
                        Colorize + restore faces
                      </p>
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4">
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                  <Button onClick={handleEnhance}>
                    Enhance Photo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing Step */}
        {step === "enhance" && (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4 animate-pulse">✨</div>
            <h3 className="font-display text-xl text-sage-dark mb-2">
              Enhancing Your Photo
            </h3>
            <p className="text-gray-500">
              {enhancementType === "colorize" && "Adding color to your memories..."}
              {enhancementType === "restore" && "Restoring faces with AI..."}
              {enhancementType === "both" && "Colorizing and restoring..."}
            </p>
            <div className="mt-6 w-48 mx-auto">
              <div className="h-2 bg-sage-pale rounded-full overflow-hidden">
                <div className="h-full bg-sage animate-pulse w-2/3 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && originalUrl && enhancedUrl && (
          <div className="space-y-6">
            <h3 className="font-medium text-sage-dark text-center">
              Drag the slider to compare
            </h3>

            {/* Before/After Comparison */}
            <BeforeAfterSlider
              beforeImage={originalUrl}
              afterImage={enhancedUrl}
              beforeLabel="Original"
              afterLabel="Enhanced"
              className="aspect-video"
            />

            {/* AI Suggested Caption */}
            {analysis?.caption && (
              <div className="bg-sage-pale/30 rounded-lg p-4">
                <h4 className="font-medium text-sage-dark mb-2">Suggested Caption</h4>
                <p className="text-gray-600 italic">"{analysis.caption}"</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={handleReset}>
                Try Another Photo
              </Button>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Different Enhancement
              </Button>
              {onSave && (
                <Button onClick={handleSave}>
                  Save to Memorial
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 pt-4 border-t text-xs text-gray-500 text-center">
          Powered by DeOldify, GFPGAN, and Claude Vision
        </div>
      </CardContent>
    </Card>
  );
}

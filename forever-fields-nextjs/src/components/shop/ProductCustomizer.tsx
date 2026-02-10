"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card } from "@/components/ui";
import {
  Upload,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Type,
  Palette,
  ShoppingCart,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/shop";

interface ProductCustomizerProps {
  product: Product;
  onAddToCart: (customization: ProductCustomization) => void;
  memorialId?: string;
  isLoading?: boolean;
}

export interface ProductCustomization {
  selectedOptions: Record<string, string>;
  textFields: Record<string, string>;
  photos: Array<{ id: string; url: string; file?: File }>;
  isRush: boolean;
  quantity: number;
  calculatedPrice: number;
}

export function ProductCustomizer({
  product,
  onAddToCart,
  memorialId,
  isLoading = false,
}: ProductCustomizerProps) {
  // Selected options (size, pages, cover, etc.)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    product.options.forEach((opt) => {
      if (opt.values.length > 0) {
        defaults[opt.id] = opt.values[0];
      }
    });
    return defaults;
  });

  // Text fields for customization
  const [textFields, setTextFields] = useState<Record<string, string>>({});

  // Uploaded photos
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; file?: File }>>([]);

  // Rush order
  const [isRush, setIsRush] = useState(false);

  // Quantity
  const [quantity, setQuantity] = useState(1);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    options: true,
    customization: true,
  });

  // Calculate total price
  const calculatedPrice = useMemo(() => {
    let price = product.basePrice;

    // Add option modifiers
    product.options.forEach((opt) => {
      const selected = selectedOptions[opt.id];
      if (selected && opt.priceModifiers?.[selected]) {
        price += opt.priceModifiers[selected];
      }
    });

    // Rush multiplier
    if (isRush && product.rushPriceMultiplier) {
      price *= product.rushPriceMultiplier;
    }

    // Quantity
    price *= quantity;

    return Math.round(price * 100) / 100;
  }, [product, selectedOptions, isRush, quantity]);

  // Handle option change
  const handleOptionChange = useCallback((optionId: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: value }));
  }, []);

  // Handle text field change
  const handleTextChange = useCallback((fieldName: string, value: string) => {
    setTextFields((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  // Handle photo upload
  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const maxPhotos = product.customizationOptions?.maxPhotos || 10;

      Array.from(files).forEach((file) => {
        if (photos.length >= maxPhotos) {
          toast.error(`Maximum ${maxPhotos} photos allowed`);
          return;
        }

        if (!file.type.startsWith("image/")) {
          toast.error("Please upload only image files");
          return;
        }

        const url = URL.createObjectURL(file);
        setPhotos((prev) => [
          ...prev,
          { id: `photo-${Date.now()}-${Math.random()}`, url, file },
        ]);
      });

      // Reset input
      e.target.value = "";
    },
    [photos.length, product.customizationOptions?.maxPhotos]
  );

  // Remove photo
  const handleRemovePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === photoId);
      if (photo?.url.startsWith("blob:")) {
        URL.revokeObjectURL(photo.url);
      }
      return prev.filter((p) => p.id !== photoId);
    });
  }, []);

  // Toggle section
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Validate before add to cart
  const validateCustomization = useCallback((): string | null => {
    // Check required text fields
    const textFieldConfig = product.customizationOptions?.textFields || [];
    for (const field of textFieldConfig) {
      if (field.required && !textFields[field.name]?.trim()) {
        return `"${field.name}" is required`;
      }
    }

    // Check max text length
    const maxLength = product.customizationOptions?.maxTextLength;
    if (maxLength) {
      for (const [name, value] of Object.entries(textFields)) {
        if (value.length > maxLength) {
          return `"${name}" exceeds maximum length of ${maxLength} characters`;
        }
      }
    }

    return null;
  }, [product.customizationOptions, textFields]);

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    const error = validateCustomization();
    if (error) {
      toast.error(error);
      return;
    }

    onAddToCart({
      selectedOptions,
      textFields,
      photos,
      isRush,
      quantity,
      calculatedPrice,
    });
  }, [
    selectedOptions,
    textFields,
    photos,
    isRush,
    quantity,
    calculatedPrice,
    onAddToCart,
    validateCustomization,
  ]);

  const customizationOptions = product.customizationOptions;

  return (
    <div className="space-y-6">
      {/* Product Options (Size, Pages, etc.) */}
      {product.options.length > 0 && (
        <Card className="overflow-hidden">
          <button
            onClick={() => toggleSection("options")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-sage" />
              <span className="font-medium text-gray-dark">Product Options</span>
            </div>
            {expandedSections.options ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.options && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-4">
                  {product.options.map((option) => (
                    <div key={option.id}>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        {option.name}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((value) => {
                          const isSelected = selectedOptions[option.id] === value;
                          const modifier = option.priceModifiers?.[value];

                          return (
                            <button
                              key={value}
                              onClick={() => handleOptionChange(option.id, value)}
                              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? "border-sage bg-sage-pale text-sage-dark"
                                  : "border-gray-200 hover:border-sage-light"
                              }`}
                            >
                              <span>{value}</span>
                              {modifier !== undefined && modifier > 0 && (
                                <span className="text-xs text-gray-muted ml-1">
                                  +${modifier}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Customization (Photos, Text) */}
      {product.customizable && customizationOptions && (
        <Card className="overflow-hidden">
          <button
            onClick={() => toggleSection("customization")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-gold" />
              <span className="font-medium text-gray-dark">Personalization</span>
            </div>
            {expandedSections.customization ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.customization && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-6">
                  {/* Text Fields */}
                  {customizationOptions.allowText && customizationOptions.textFields && (
                    <div className="space-y-4">
                      {customizationOptions.textFields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-gray-dark mb-1">
                            {field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                            {field.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={textFields[field.name] || ""}
                            onChange={(e) => handleTextChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                            maxLength={customizationOptions.maxTextLength}
                          />
                        </div>
                      ))}
                      {customizationOptions.maxTextLength && (
                        <p className="text-xs text-gray-muted">
                          Max {customizationOptions.maxTextLength} characters per field
                        </p>
                      )}
                    </div>
                  )}

                  {/* Photo Upload */}
                  {customizationOptions.allowPhoto && (
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Photos
                        <span className="text-gray-muted font-normal ml-2">
                          ({photos.length}/{customizationOptions.maxPhotos || 10})
                        </span>
                      </label>

                      {/* Photo Grid */}
                      {photos.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {photos.map((photo) => (
                            <div
                              key={photo.id}
                              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                            >
                              <Image
                                src={photo.url}
                                alt="Uploaded photo"
                                fill
                                className="object-cover"
                              />
                              <button
                                onClick={() => handleRemovePhoto(photo.id)}
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Button */}
                      {photos.length < (customizationOptions.maxPhotos || 10) && (
                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-sage transition-colors">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-body">Upload Photos</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Memorial Link Info */}
                  {memorialId && (
                    <div className="flex items-start gap-2 p-3 bg-sage-pale/30 rounded-lg">
                      <Check className="w-5 h-5 text-sage mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-dark">
                          Linked to Memorial
                        </p>
                        <p className="text-xs text-gray-body">
                          Product will include QR code linking to your memorial page
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Rush Order */}
      {product.rushAvailable && (
        <Card className="p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isRush}
              onChange={(e) => setIsRush(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-sage focus:ring-sage"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-dark">Rush Order</span>
                {product.rushPriceMultiplier && (
                  <span className="text-sm text-coral">
                    +{Math.round((product.rushPriceMultiplier - 1) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-body">
                Get it in {product.rushDays} days instead of {product.productionDays} days
              </p>
            </div>
          </label>
        </Card>
      )}

      {/* Quantity & Price */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium text-gray-dark">Quantity</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-body">Base Price</span>
            <span className="text-gray-dark">${product.basePrice.toFixed(2)}</span>
          </div>
          {Object.entries(selectedOptions).map(([optId, value]) => {
            const opt = product.options.find((o) => o.id === optId);
            const modifier = opt?.priceModifiers?.[value];
            if (!modifier) return null;
            return (
              <div key={optId} className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gray-muted">{opt?.name}: {value}</span>
                <span className="text-gray-body">+${modifier.toFixed(2)}</span>
              </div>
            );
          })}
          {isRush && product.rushPriceMultiplier && (
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-coral">Rush Fee</span>
              <span className="text-coral">
                +{Math.round((product.rushPriceMultiplier - 1) * 100)}%
              </span>
            </div>
          )}
          {quantity > 1 && (
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-gray-muted">Quantity</span>
              <span className="text-gray-body">×{quantity}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-dark">Total</span>
            <span className="text-xl font-bold text-sage-dark">
              ${calculatedPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        disabled={isLoading}
        className="w-full py-4 text-lg"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <ShoppingCart className="w-5 h-5 mr-2" />
        )}
        Add to Cart
      </Button>

      {/* Production Info */}
      <div className="flex items-start gap-2 text-sm text-gray-muted">
        <AlertCircle className="w-4 h-4 mt-0.5" />
        <p>
          Production takes {isRush ? product.rushDays : product.productionDays} business days.
          {product.requiresProofApproval && " Proof approval required before production."}
        </p>
      </div>
    </div>
  );
}

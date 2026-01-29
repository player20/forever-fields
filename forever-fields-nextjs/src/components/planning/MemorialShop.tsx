"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

// Extracted types, data, and utilities
import type {
  Product,
  ProductCategory,
  CartItem,
  ShippingAddress,
  ShippingOption,
  Order,
  PromoCode,
  ShopView
} from "@/types/shop";
import { CATEGORY_LABELS } from "@/types/shop";
import { PRODUCT_CATALOG } from "@/data/products";
import { calculateItemPrice, calculateShipping, calculateTax, formatCurrency, generateOrderId } from "@/lib/shop-utils";
// ShoppingCart component available at ../shop/ShoppingCart if needed

// ============================================================================
// COMPONENTS
// ============================================================================

interface MemorialShopProps {
  memorialId?: string;
  deceasedName?: string;
  deceasedPhoto?: string;
  onOrderComplete?: (order: Order) => void;
}

export function MemorialShop({
  memorialId: _memorialId,
  deceasedName = "",
  deceasedPhoto,
  onOrderComplete
}: MemorialShopProps) {
  // View state
  const [view, setView] = useState<ShopView>("catalog");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<CartItem> | null>(null);

  // Checkout state
  const [shippingAddress, setShippingAddress] = useState<Partial<ShippingAddress>>({
    country: "US",
    isResidential: true
  });
  const [billingAddress, _setBillingAddress] = useState<Partial<ShippingAddress>>({});
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Error/loading states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Computed values
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return PRODUCT_CATALOG;
    return PRODUCT_CATALOG.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const cartSubtotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.totalPrice, 0)
  , [cart]);

  const rushItems = useMemo(() =>
    cart.filter(item => item.isRush)
  , [cart]);

  const rushFee = useMemo(() =>
    rushItems.reduce((sum, item) => {
      const basePrice = calculateItemPrice(item.product, item.selectedOptions, false);
      return sum + ((item.unitPrice - basePrice) * item.quantity);
    }, 0)
  , [rushItems]);

  const promoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "percentage") {
      const discount = cartSubtotal * (appliedPromo.value / 100);
      return appliedPromo.maxDiscount ? Math.min(discount, appliedPromo.maxDiscount) : discount;
    } else if (appliedPromo.type === "fixed") {
      return appliedPromo.value;
    }
    return 0;
  }, [appliedPromo, cartSubtotal]);

  const tax = useMemo(() =>
    calculateTax(
      cartSubtotal - promoDiscount,
      shippingAddress.state || "",
      shippingAddress.country || "US"
    )
  , [cartSubtotal, promoDiscount, shippingAddress.state, shippingAddress.country]);

  const shippingCost = useMemo(() => {
    if (appliedPromo?.type === "free_shipping") return 0;
    return selectedShipping?.price || 0;
  }, [selectedShipping, appliedPromo]);

  const orderTotal = useMemo(() =>
    Math.max(0, cartSubtotal - promoDiscount + tax + shippingCost)
  , [cartSubtotal, promoDiscount, tax, shippingCost]);

  // Handlers
  const handleAddToCart = useCallback(() => {
    if (!selectedProduct || !currentItem) return;

    const newItem: CartItem = {
      id: `${selectedProduct.id}-${Date.now()}`,
      product: selectedProduct,
      quantity: currentItem.quantity || 1,
      selectedOptions: currentItem.selectedOptions || {},
      customization: currentItem.customization,
      isRush: currentItem.isRush || false,
      unitPrice: calculateItemPrice(
        selectedProduct,
        currentItem.selectedOptions || {},
        currentItem.isRush || false
      ),
      totalPrice: 0,
      proofStatus: selectedProduct.requiresProofApproval ? "pending" : undefined,
      notes: currentItem.notes
    };
    newItem.totalPrice = newItem.unitPrice * newItem.quantity;

    setCart(prev => [...prev, newItem]);
    setCurrentItem(null);
    setSelectedProduct(null);
    setView("cart");
  }, [selectedProduct, currentItem]);

  const handleRemoveFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const minQty = item.product.minimumQuantity || 1;
      const newQty = Math.max(minQty, quantity);
      return {
        ...item,
        quantity: newQty,
        totalPrice: item.unitPrice * newQty
      };
    }));
  }, []);

  const handleApplyPromo = useCallback(() => {
    // Demo promo codes
    const promos: Record<string, PromoCode> = {
      "MEMORIAL10": { code: "MEMORIAL10", type: "percentage", value: 10 },
      "FREESHIP": { code: "FREESHIP", type: "free_shipping", value: 0, minOrderAmount: 50 },
      "SAVE20": { code: "SAVE20", type: "fixed", value: 20, minOrderAmount: 100 }
    };

    const promo = promos[promoCode.toUpperCase()];
    if (!promo) {
      setErrors(prev => ({ ...prev, promo: "Invalid promo code" }));
      return;
    }
    if (promo.minOrderAmount && cartSubtotal < promo.minOrderAmount) {
      setErrors(prev => ({
        ...prev,
        promo: `Minimum order of ${formatCurrency(promo.minOrderAmount ?? 0)} required`
      }));
      return;
    }

    setAppliedPromo(promo);
    setErrors(prev => ({ ...prev, promo: "" }));
  }, [promoCode, cartSubtotal]);

  const validateShippingAddress = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!shippingAddress.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!shippingAddress.lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!shippingAddress.street1?.trim()) newErrors.street1 = "Street address is required";
    if (!shippingAddress.city?.trim()) newErrors.city = "City is required";
    if (!shippingAddress.state?.trim() && shippingAddress.country === "US") {
      newErrors.state = "State is required";
    }
    if (!shippingAddress.postalCode?.trim()) newErrors.postalCode = "ZIP/Postal code is required";
    if (!shippingAddress.email?.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!shippingAddress.phone?.trim()) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [shippingAddress]);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedShipping) return;

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const order: Order = {
      id: generateOrderId(),
      items: cart,
      shippingAddress: shippingAddress as ShippingAddress,
      billingAddress: billingSameAsShipping
        ? shippingAddress as ShippingAddress
        : billingAddress as ShippingAddress,
      shippingMethod: selectedShipping,
      subtotal: cartSubtotal,
      shippingCost,
      tax,
      rushFee,
      discount: promoDiscount,
      total: orderTotal,
      status: cart.some(item => item.proofStatus === "pending") ? "proof_review" : "pending",
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(
        Date.now() + (selectedShipping.estimatedDays +
          Math.max(...cart.map(i => i.isRush && i.product.rushDays
            ? i.product.rushDays
            : i.product.productionDays))) * 24 * 60 * 60 * 1000
      ).toISOString(),
      specialInstructions,
      giftMessage: isGift ? giftMessage : undefined,
      isGift
    };

    setCompletedOrder(order);
    setCart([]);
    setView("confirmation");
    setIsProcessing(false);

    onOrderComplete?.(order);
  }, [
    cart, shippingAddress, billingAddress, billingSameAsShipping, selectedShipping,
    cartSubtotal, shippingCost, tax, rushFee, promoDiscount, orderTotal,
    specialInstructions, isGift, giftMessage, onOrderComplete
  ]);

  // Render product card
  const renderProductCard = (product: Product) => (
    <Card
      key={product.id}
      className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => {
        setSelectedProduct(product);
        setCurrentItem({
          product,
          quantity: product.minimumQuantity || 1,
          selectedOptions: Object.fromEntries(
            product.options.map(opt => [opt.id, opt.values[0]])
          ),
          customization: product.customizable ? {
            photos: deceasedPhoto ? [{ id: "1", url: deceasedPhoto }] : [],
            textFields: deceasedName ? { name: deceasedName } : {}
          } : undefined,
          isRush: false
        });
        setView("product");
      }}
    >
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
        <span className="text-4xl">
          {product.category === "photo_books" && "📖"}
          {product.category === "qr_plaques" && "🏷️"}
          {product.category === "memorial_cards" && "📄"}
          {product.category === "canvas_prints" && "🖼️"}
          {product.category === "urns" && "⚱️"}
          {product.category === "jewelry" && "💎"}
          {product.category === "keepsakes" && "🎁"}
          {product.category === "flowers" && "💐"}
          {product.category === "donations" && "🌳"}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900">{product.name}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="font-bold text-primary-600">
          {formatCurrency(product.basePrice)}
          {product.options.length > 0 && "+"}
        </span>
        {!product.inStock && (
          <span className="text-xs text-red-600 font-medium">Out of Stock</span>
        )}
      </div>
      {product.rushAvailable && (
        <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
          Rush Available
        </span>
      )}
    </Card>
  );

  // Render catalog view
  const renderCatalog = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Memorial Shop</h2>
        {cart.length > 0 && (
          <Button onClick={() => setView("cart")}>
            View Cart ({cart.length})
          </Button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(CATEGORY_LABELS) as Array<ProductCategory | "all">).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(renderProductCard)}
      </div>
    </div>
  );

  // Render product detail
  const renderProductDetail = () => {
    if (!selectedProduct || !currentItem) return null;

    const itemPrice = calculateItemPrice(
      selectedProduct,
      currentItem.selectedOptions || {},
      currentItem.isRush || false
    );

    return (
      <div>
        <button
          onClick={() => { setView("catalog"); setSelectedProduct(null); }}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Shop
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product image */}
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-8xl">
              {selectedProduct.category === "photo_books" && "📖"}
              {selectedProduct.category === "qr_plaques" && "🏷️"}
              {selectedProduct.category === "memorial_cards" && "📄"}
              {selectedProduct.category === "canvas_prints" && "🖼️"}
              {selectedProduct.category === "urns" && "⚱️"}
              {selectedProduct.category === "jewelry" && "💎"}
              {selectedProduct.category === "keepsakes" && "🎁"}
              {selectedProduct.category === "flowers" && "💐"}
              {selectedProduct.category === "donations" && "🌳"}
            </span>
          </div>

          {/* Product details */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h1>
            <p className="text-gray-600 mb-4">{selectedProduct.description}</p>

            <div className="text-3xl font-bold text-primary-600 mb-6">
              {formatCurrency(itemPrice)}
            </div>

            {/* Options */}
            <div className="space-y-4 mb-6">
              {selectedProduct.options.map(option => (
                <div key={option.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {option.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map(value => {
                      const isSelected = currentItem.selectedOptions?.[option.id] === value;
                      const priceModifier = option.priceModifiers?.[value];
                      return (
                        <button
                          key={value}
                          onClick={() => setCurrentItem(prev => ({
                            ...prev,
                            selectedOptions: {
                              ...prev?.selectedOptions,
                              [option.id]: value
                            }
                          }))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                            isSelected
                              ? "border-primary-600 bg-primary-50 text-primary-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {value}
                          {priceModifier && priceModifier > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              (+{formatCurrency(priceModifier)})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Rush order */}
            {selectedProduct.rushAvailable && (
              <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={currentItem.isRush || false}
                    onChange={(e) => setCurrentItem(prev => ({
                      ...prev,
                      isRush: e.target.checked
                    }))}
                    className="w-5 h-5 rounded text-amber-600"
                  />
                  <div>
                    <span className="font-medium text-amber-800">Rush Order</span>
                    <p className="text-sm text-amber-700">
                      Get it in {selectedProduct.rushDays} days instead of {selectedProduct.productionDays} days
                      {selectedProduct.rushPriceMultiplier && (
                        <span> ({Math.round((selectedProduct.rushPriceMultiplier - 1) * 100)}% additional)</span>
                      )}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentItem(prev => ({
                    ...prev,
                    quantity: Math.max((selectedProduct.minimumQuantity || 1), (prev?.quantity || 1) - 1)
                  }))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-16 text-center font-medium">{currentItem.quantity || 1}</span>
                <button
                  onClick={() => setCurrentItem(prev => ({
                    ...prev,
                    quantity: (prev?.quantity || 1) + 1
                  }))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              {selectedProduct.minimumQuantity && (
                <p className="text-sm text-gray-500 mt-1">
                  Minimum quantity: {selectedProduct.minimumQuantity}
                </p>
              )}
            </div>

            {/* Customization button */}
            {selectedProduct.customizable && (
              <Button
                onClick={() => setView("customize")}
                variant="secondary"
                className="w-full mb-3"
              >
                Customize Product
              </Button>
            )}

            {/* Add to cart */}
            <Button
              onClick={handleAddToCart}
              disabled={!selectedProduct.inStock}
              className="w-full"
            >
              {selectedProduct.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>

            {/* Production info */}
            <div className="mt-6 text-sm text-gray-600">
              <p>Production time: {currentItem.isRush && selectedProduct.rushDays
                ? selectedProduct.rushDays
                : selectedProduct.productionDays} business days</p>
              {selectedProduct.requiresProofApproval && (
                <p className="text-amber-700 mt-1">
                  This product requires proof approval before production
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render customization view
  const renderCustomization = () => {
    if (!selectedProduct || !currentItem) return null;

    const customOpts = selectedProduct.customizationOptions;
    if (!customOpts) return null;

    return (
      <div>
        <button
          onClick={() => setView("product")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Product
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Customize Your {selectedProduct.name}
        </h2>

        <div className="space-y-6">
          {/* Photo upload */}
          {customOpts.allowPhoto && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Photos</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-2">
                  Drag and drop photos here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  {customOpts.maxPhotos === 1
                    ? "1 photo allowed"
                    : `Up to ${customOpts.maxPhotos} photos allowed`}
                </p>
                <Button variant="secondary" className="mt-4">
                  Upload Photos
                </Button>
              </div>
              {currentItem.customization?.photos && currentItem.customization.photos.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4">
                  {currentItem.customization.photos.map((photo, idx) => (
                    <div key={photo.id} className="relative">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                        {photo.url ? (
                          <span className="text-sm text-gray-600">Photo {idx + 1}</span>
                        ) : (
                          <span className="text-gray-400">?</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Text fields */}
          {customOpts.allowText && customOpts.textFields && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Text & Inscriptions</h3>
              <div className="space-y-4">
                {customOpts.textFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.name.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.name === "obituary" || field.name === "dedication" || field.name === "message" ? (
                      <Textarea
                        placeholder={field.placeholder}
                        value={currentItem.customization?.textFields?.[field.name] || ""}
                        onChange={(e) => setCurrentItem(prev => ({
                          ...prev,
                          customization: {
                            ...prev?.customization,
                            photos: prev?.customization?.photos || [],
                            textFields: {
                              ...prev?.customization?.textFields,
                              [field.name]: e.target.value
                            }
                          }
                        }))}
                        rows={4}
                      />
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={currentItem.customization?.textFields?.[field.name] || ""}
                        onChange={(e) => setCurrentItem(prev => ({
                          ...prev,
                          customization: {
                            ...prev?.customization,
                            photos: prev?.customization?.photos || [],
                            textFields: {
                              ...prev?.customization?.textFields,
                              [field.name]: e.target.value
                            }
                          }
                        }))}
                      />
                    )}
                  </div>
                ))}
              </div>
              {customOpts.maxTextLength && (
                <p className="text-sm text-gray-500 mt-2">
                  Maximum {customOpts.maxTextLength} characters per field
                </p>
              )}
            </Card>
          )}

          {/* Design selection */}
          {customOpts.allowDesign && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Choose a Design Template</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {["Classic", "Modern", "Floral", "Religious", "Nature", "Custom"].map(design => (
                  <button
                    key={design}
                    className="aspect-video bg-gray-100 rounded-lg border-2 border-gray-200 hover:border-primary-500 flex items-center justify-center text-sm font-medium text-gray-700"
                  >
                    {design}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Special notes */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Special Instructions</h3>
            <Textarea
              placeholder="Any special requests or notes about your order..."
              value={currentItem.notes || ""}
              onChange={(e) => setCurrentItem(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              rows={3}
            />
          </Card>
        </div>

        <div className="mt-6 flex gap-4">
          <Button onClick={() => setView("product")} variant="secondary" className="flex-1">
            Back
          </Button>
          <Button onClick={() => setView("product")} className="flex-1">
            Save Customization
          </Button>
        </div>
      </div>
    );
  };

  // Render cart view
  const renderCart = () => (
    <div>
      <button
        onClick={() => setView("catalog")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Continue Shopping
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h2>

      {cart.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Button onClick={() => setView("catalog")}>Browse Products</Button>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-3xl">
                      {item.product.category === "photo_books" && "📖"}
                      {item.product.category === "qr_plaques" && "🏷️"}
                      {item.product.category === "memorial_cards" && "📄"}
                      {item.product.category === "canvas_prints" && "🖼️"}
                      {item.product.category === "urns" && "⚱️"}
                      {item.product.category === "jewelry" && "💎"}
                      {item.product.category === "keepsakes" && "🎁"}
                      {item.product.category === "flowers" && "💐"}
                      {item.product.category === "donations" && "🌳"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {Object.entries(item.selectedOptions).map(([key, value]) => (
                        <span key={key} className="mr-3">{key}: {value}</span>
                      ))}
                    </div>
                    {item.isRush && (
                      <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                        Rush Order
                      </span>
                    )}
                    {item.proofStatus === "pending" && (
                      <span className="inline-block mt-1 ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Proof Pending
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="w-10 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-primary-600">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order summary */}
          <div>
            <Card className="p-6 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                {rushFee > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Rush Fee</span>
                    <span>Included</span>
                  </div>
                )}
                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedPromo.code})</span>
                    <span>-{formatCurrency(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              {/* Promo code */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleApplyPromo} variant="secondary">
                    Apply
                  </Button>
                </div>
                {errors.promo && (
                  <p className="text-red-500 text-sm mt-1">{errors.promo}</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(cartSubtotal - promoDiscount)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">+ shipping & tax at checkout</p>
              </div>

              <Button
                onClick={() => setView("checkout_address")}
                className="w-full mt-4"
              >
                Proceed to Checkout
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );

  // Render checkout address
  const renderCheckoutAddress = () => (
    <div>
      <button
        onClick={() => setView("cart")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Back to Cart
      </button>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {["Address", "Shipping", "Payment", "Review"].map((step, idx) => (
          <React.Fragment key={step}>
            <div className={`flex items-center gap-2 ${idx === 0 ? "text-primary-600" : "text-gray-400"}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                idx === 0 ? "bg-primary-600 text-white" : "bg-gray-200"
              }`}>
                {idx + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {idx < 3 && <div className="w-8 h-px bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Address</h2>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <Input
                  value={shippingAddress.firstName || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                  error={errors.firstName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <Input
                  value={shippingAddress.lastName || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                  error={errors.lastName}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company (optional)
                </label>
                <Input
                  value={shippingAddress.company || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <Input
                  value={shippingAddress.street1 || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, street1: e.target.value }))}
                  error={errors.street1}
                  placeholder="Street address, P.O. box, c/o"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apt, Suite, etc. (optional)
                </label>
                <Input
                  value={shippingAddress.street2 || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, street2: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <Input
                  value={shippingAddress.city || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                  error={errors.city}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province *
                </label>
                <Input
                  value={shippingAddress.state || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                  error={errors.state}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP/Postal Code *
                </label>
                <Input
                  value={shippingAddress.postalCode || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                  error={errors.postalCode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <select
                  value={shippingAddress.country || "US"}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={shippingAddress.email || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                  error={errors.email}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <Input
                  type="tel"
                  value={shippingAddress.phone || ""}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                  error={errors.phone}
                />
              </div>
            </div>

            {/* Gift options */}
            <div className="mt-6 pt-6 border-t">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={(e) => setIsGift(e.target.checked)}
                  className="w-5 h-5 rounded text-primary-600"
                />
                <span className="font-medium text-gray-900">This is a gift</span>
              </label>
              {isGift && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gift Message (optional)
                  </label>
                  <Textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Include a personal message with your gift..."
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Price will not be shown on the packing slip
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Order summary sidebar */}
        <div>
          <Card className="p-6 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-600">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between font-bold">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal - promoDiscount)}</span>
              </div>
            </div>
            <Button
              onClick={() => {
                if (validateShippingAddress()) {
                  setView("checkout_shipping");
                }
              }}
              className="w-full mt-4"
            >
              Continue to Shipping
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );

  // Render checkout shipping
  const renderCheckoutShipping = () => {
    const shippingOptions: ShippingOption[] = [
      calculateShipping(cart, shippingAddress as ShippingAddress, "standard"),
      calculateShipping(cart, shippingAddress as ShippingAddress, "express"),
      shippingAddress.country === "US"
        ? calculateShipping(cart, shippingAddress as ShippingAddress, "overnight")
        : null,
      { method: "pickup", carrier: "Local", serviceName: "Local Pickup", price: 0, estimatedDays: 0 }
    ].filter((opt): opt is ShippingOption => opt !== null);

    return (
      <div>
        <button
          onClick={() => setView("checkout_address")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Address
        </button>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {["Address", "Shipping", "Payment", "Review"].map((step, idx) => (
            <React.Fragment key={step}>
              <div className={`flex items-center gap-2 ${idx <= 1 ? "text-primary-600" : "text-gray-400"}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  idx < 1 ? "bg-green-600 text-white" : idx === 1 ? "bg-primary-600 text-white" : "bg-gray-200"
                }`}>
                  {idx < 1 ? "✓" : idx + 1}
                </span>
                <span className="hidden sm:inline">{step}</span>
              </div>
              {idx < 3 && <div className="w-8 h-px bg-gray-300" />}
            </React.Fragment>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Method</h2>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-4">
                {shippingOptions.map(option => (
                  <label
                    key={option.method}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedShipping?.method === option.method
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedShipping?.method === option.method}
                        onChange={() => setSelectedShipping(option)}
                        className="w-5 h-5 text-primary-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{option.serviceName}</p>
                        <p className="text-sm text-gray-600">
                          {option.method === "pickup"
                            ? "Pick up at our location"
                            : `${option.carrier} - ${option.estimatedDays} business days`}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">
                      {option.price === 0 ? "FREE" : formatCurrency(option.price)}
                    </span>
                  </label>
                ))}
              </div>

              {/* Special instructions */}
              <div className="mt-6 pt-6 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Instructions (optional)
                </label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Gate code, leave at door, etc..."
                  rows={2}
                />
              </div>
            </Card>
          </div>

          {/* Order summary sidebar */}
          <div>
            <Card className="p-6 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{selectedShipping ? formatCurrency(shippingCost) : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>
              <Button
                onClick={() => setView("checkout_payment")}
                disabled={!selectedShipping}
                className="w-full mt-4"
              >
                Continue to Payment
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Render checkout payment (simplified)
  const renderCheckoutPayment = () => (
    <div>
      <button
        onClick={() => setView("checkout_shipping")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Back to Shipping
      </button>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {["Address", "Shipping", "Payment", "Review"].map((step, idx) => (
          <React.Fragment key={step}>
            <div className={`flex items-center gap-2 ${idx <= 2 ? "text-primary-600" : "text-gray-400"}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                idx < 2 ? "bg-green-600 text-white" : idx === 2 ? "bg-primary-600 text-white" : "bg-gray-200"
              }`}>
                {idx < 2 ? "✓" : idx + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {idx < 3 && <div className="w-8 h-px bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <p className="text-center text-gray-600 py-8">
              Payment form would integrate with Stripe or PayPal here.
              <br />
              For demo purposes, click continue to simulate payment.
            </p>

            {/* Billing address */}
            <div className="mt-6 pt-6 border-t">
              <label className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="w-5 h-5 rounded text-primary-600"
                />
                <span className="font-medium text-gray-900">
                  Billing address same as shipping
                </span>
              </label>
            </div>
          </Card>
        </div>

        {/* Order summary sidebar */}
        <div>
          <Card className="p-6 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(orderTotal)}</span>
              </div>
            </div>
            <Button
              onClick={() => setView("checkout_review")}
              className="w-full mt-4"
            >
              Review Order
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );

  // Render checkout review
  const renderCheckoutReview = () => (
    <div>
      <button
        onClick={() => setView("checkout_payment")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Back to Payment
      </button>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {["Address", "Shipping", "Payment", "Review"].map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2 text-primary-600">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                idx < 3 ? "bg-green-600 text-white" : "bg-primary-600 text-white"
              }`}>
                {idx < 3 ? "✓" : idx + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {idx < 3 && <div className="w-8 h-px bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Order</h2>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-2xl">
                      {item.product.category === "photo_books" && "📖"}
                      {item.product.category === "qr_plaques" && "🏷️"}
                      {item.product.category === "memorial_cards" && "📄"}
                      {item.product.category === "canvas_prints" && "🖼️"}
                      {item.product.category === "jewelry" && "💎"}
                      {item.product.category === "keepsakes" && "🎁"}
                      {item.product.category === "flowers" && "💐"}
                      {item.product.category === "donations" && "🌳"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    {item.isRush && (
                      <span className="text-xs text-amber-700">Rush Order</span>
                    )}
                  </div>
                  <span className="font-bold">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Shipping address */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
              <button
                onClick={() => setView("checkout_address")}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Edit
              </button>
            </div>
            <p className="text-gray-600">
              {shippingAddress.firstName} {shippingAddress.lastName}<br />
              {shippingAddress.street1}<br />
              {shippingAddress.street2 && <>{shippingAddress.street2}<br /></>}
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
              {shippingAddress.country}
            </p>
          </Card>

          {/* Shipping method */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900 mb-2">Shipping Method</h3>
              <button
                onClick={() => setView("checkout_shipping")}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Edit
              </button>
            </div>
            <p className="text-gray-600">
              {selectedShipping?.serviceName} - {selectedShipping?.carrier}
              <br />
              <span className="text-sm">
                Estimated delivery: {selectedShipping?.estimatedDays === 0
                  ? "Same day"
                  : `${selectedShipping?.estimatedDays} business days`}
              </span>
            </p>
          </Card>

          {/* Proof approval notice */}
          {cart.some(item => item.product.requiresProofApproval) && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Proof Approval Required</h3>
              <p className="text-blue-800 text-sm">
                Some items in your order require proof approval before production.
                You will receive an email with proof images within 1-2 business days.
                Production will begin after you approve the proofs.
              </p>
            </Card>
          )}
        </div>

        {/* Order total */}
        <div>
          <Card className="p-6 sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Order Total</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedPromo?.code})</span>
                  <span>-{formatCurrency(promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(orderTotal)}</span>
              </div>
            </div>
            <Button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full mt-4"
            >
              {isProcessing ? "Processing..." : "Place Order"}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-3">
              By placing this order, you agree to our Terms of Service and Privacy Policy
            </p>
          </Card>
        </div>
      </div>
    </div>
  );

  // Render confirmation
  const renderConfirmation = () => {
    if (!completedOrder) return null;

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your order. We&apos;ve sent a confirmation to {shippingAddress.email}.
        </p>

        <Card className="p-6 text-left mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Order #{completedOrder.id}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              completedOrder.status === "proof_review"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}>
              {completedOrder.status === "proof_review" ? "Awaiting Proof Approval" : "Processing"}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date</span>
              <span>{new Date(completedOrder.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Delivery</span>
              <span>{new Date(completedOrder.estimatedDelivery).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(completedOrder.total)}</span>
            </div>
          </div>
        </Card>

        {completedOrder.status === "proof_review" && (
          <Card className="p-6 bg-blue-50 border-blue-200 text-left mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
            <p className="text-blue-800 text-sm">
              You will receive proof images via email within 1-2 business days.
              Please review them carefully and approve or request changes.
              Production will begin after your approval.
            </p>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button onClick={() => setView("catalog")} variant="secondary">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {view === "catalog" && renderCatalog()}
        {view === "product" && renderProductDetail()}
        {view === "customize" && renderCustomization()}
        {view === "cart" && renderCart()}
        {view === "checkout_address" && renderCheckoutAddress()}
        {view === "checkout_shipping" && renderCheckoutShipping()}
        {view === "checkout_payment" && renderCheckoutPayment()}
        {view === "checkout_review" && renderCheckoutReview()}
        {view === "confirmation" && renderConfirmation()}
      </div>
    </div>
  );
}

export default MemorialShop;

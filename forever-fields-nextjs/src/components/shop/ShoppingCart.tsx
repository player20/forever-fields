"use client";

import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type { CartItem, PromoCode, ProductCategory } from "@/types/shop";
import { formatCurrency } from "@/lib/shop-utils";

const CATEGORY_ICONS: Record<ProductCategory, string> = {
  photo_books: "📖",
  qr_plaques: "🏷️",
  memorial_cards: "📄",
  canvas_prints: "🖼️",
  urns: "⚱️",
  jewelry: "💎",
  keepsakes: "🎁",
  flowers: "💐",
  donations: "🌳"
};

interface ShoppingCartProps {
  cart: CartItem[];
  cartSubtotal: number;
  rushFee: number;
  promoDiscount: number;
  appliedPromo: PromoCode | null;
  promoCode: string;
  promoError?: string;
  onPromoCodeChange: (code: string) => void;
  onApplyPromo: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

export function ShoppingCart({
  cart,
  cartSubtotal,
  rushFee,
  promoDiscount,
  appliedPromo,
  promoCode,
  promoError,
  onPromoCodeChange,
  onApplyPromo,
  onRemoveItem,
  onUpdateQuantity,
  onContinueShopping,
  onCheckout
}: ShoppingCartProps) {
  return (
    <div>
      <button
        onClick={onContinueShopping}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        ← Continue Shopping
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h2>

      {cart.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Button onClick={onContinueShopping}>Browse Products</Button>
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
                      {CATEGORY_ICONS[item.product.category]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                      <button
                        onClick={() => onRemoveItem(item.id)}
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
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="w-10 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
                    onChange={(e) => onPromoCodeChange(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={onApplyPromo} variant="secondary">
                    Apply
                  </Button>
                </div>
                {promoError && (
                  <p className="text-red-500 text-sm mt-1">{promoError}</p>
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
                onClick={onCheckout}
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
}

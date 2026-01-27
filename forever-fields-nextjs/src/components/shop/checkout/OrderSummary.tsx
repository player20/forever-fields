"use client";

import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import type { CartItem, PromoCode } from "@/types/shop";
import { formatCurrency } from "@/lib/shop-utils";

interface OrderSummaryProps {
  cart: CartItem[];
  cartSubtotal: number;
  promoDiscount: number;
  appliedPromo: PromoCode | null;
  shippingCost?: number;
  tax?: number;
  orderTotal?: number;
  showItems?: boolean;
  showShipping?: boolean;
  buttonText: string;
  buttonDisabled?: boolean;
  onButtonClick: () => void;
}

export function OrderSummary({
  cart,
  cartSubtotal,
  promoDiscount,
  appliedPromo,
  shippingCost,
  tax,
  orderTotal,
  showItems = false,
  showShipping = false,
  buttonText,
  buttonDisabled = false,
  onButtonClick
}: OrderSummaryProps) {
  return (
    <Card className="p-6 sticky top-4">
      <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

      {showItems && (
        <div className="space-y-3 text-sm mb-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between">
              <span className="text-gray-600">
                {item.product.name} × {item.quantity}
              </span>
              <span>{formatCurrency(item.totalPrice)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>{formatCurrency(cartSubtotal)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount{appliedPromo ? ` (${appliedPromo.code})` : ""}</span>
            <span>-{formatCurrency(promoDiscount)}</span>
          </div>
        )}
        {showShipping && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>{shippingCost !== undefined ? formatCurrency(shippingCost) : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>{tax !== undefined ? formatCurrency(tax) : "-"}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(orderTotal ?? (cartSubtotal - promoDiscount))}</span>
        </div>
        {!showShipping && (
          <p className="text-sm text-gray-500 mt-1">+ shipping & tax at checkout</p>
        )}
      </div>

      <Button
        onClick={onButtonClick}
        disabled={buttonDisabled}
        className="w-full mt-4"
      >
        {buttonText}
      </Button>
    </Card>
  );
}

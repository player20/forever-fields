"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp } from "@/components/motion";
import {
  CheckCircle,
  Package,
  Truck,
  Mail,
  ArrowRight,
  ShoppingBag,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useShopCart } from "@/hooks/useShopCart";

interface OrderData {
  orderId: string;
  orderNumber: string;
  status: string;
  total: number;
  customerEmail?: string;
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  items?: Array<{
    id: string;
    description?: string;
    quantity?: number;
    amount_total?: number;
  }>;
  demo?: boolean;
}

export default function ShopSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const demoOrderId = searchParams.get("order");
  const isDemo = searchParams.get("demo") === "true";

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clearCart } = useShopCart();

  useEffect(() => {
    async function fetchOrder() {
      if (!sessionId && !demoOrderId) {
        setError("No order information found");
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (sessionId) params.set("session_id", sessionId);
        if (demoOrderId) params.set("order", demoOrderId);

        const response = await fetch(`/api/stripe/shop-checkout?${params}`);
        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setOrder(data.order || data);
          // Clear cart after successful order
          clearCart();
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [sessionId, demoOrderId, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-4 border-sage border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <FadeIn>
            <Card className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-coral mx-auto mb-4" />
              <h1 className="text-2xl font-serif font-bold text-gray-dark mb-2">
                Order Not Found
              </h1>
              <p className="text-gray-body mb-6">
                {error || "We couldn't find your order. Please contact support if you believe this is an error."}
              </p>
              <Link href="/shop">
                <Button>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Return to Shop
                </Button>
              </Link>
            </Card>
          </FadeIn>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-16">
        <FadeIn>
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-sage-pale rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-sage" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-dark mb-2">
              Thank You for Your Order!
            </h1>
            <p className="text-gray-body">
              Your order has been placed successfully.
            </p>
            {isDemo && (
              <Badge variant="secondary" className="mt-2">
                Demo Order
              </Badge>
            )}
          </div>

          {/* Order Details Card */}
          <SlideUp delay={0.1}>
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-dark">
                    Order #{order.orderNumber}
                  </h2>
                  <p className="text-sm text-gray-body">
                    {order.customerEmail && `Confirmation sent to ${order.customerEmail}`}
                  </p>
                </div>
                <Badge
                  variant={order.status === "paid" ? "default" : "secondary"}
                  className={order.status === "paid" ? "bg-green-100 text-green-700" : ""}
                >
                  {order.status === "paid" ? "Confirmed" : order.status}
                </Badge>
              </div>

              {/* Order Summary */}
              {order.items && order.items.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h3 className="font-medium text-gray-dark mb-3">Items</h3>
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={item.id || i} className="flex justify-between text-sm">
                        <span className="text-gray-body">
                          {item.description} {item.quantity && `x${item.quantity}`}
                        </span>
                        {item.amount_total && (
                          <span className="text-gray-dark font-medium">
                            ${(item.amount_total / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <span className="font-medium text-gray-dark">Total</span>
                <span className="text-lg font-bold text-sage-dark">
                  ${order.total.toFixed(2)}
                </span>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-medium text-gray-dark mb-2">Shipping To</h3>
                  <p className="text-sm text-gray-body">
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postal_code}
                    <br />
                    {order.shippingAddress.country}
                  </p>
                </div>
              )}
            </Card>
          </SlideUp>

          {/* What's Next */}
          <SlideUp delay={0.2}>
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-dark mb-4">What Happens Next</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-sage-pale rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-sage" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-dark">Confirmation Email</h4>
                    <p className="text-sm text-gray-body">
                      You'll receive an order confirmation email shortly.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gold-pale rounded-full flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-gold-dark" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-dark">Order Processing</h4>
                    <p className="text-sm text-gray-body">
                      Our partners will prepare your items with care.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-coral-pale rounded-full flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-coral-dark" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-dark">Shipping Updates</h4>
                    <p className="text-sm text-gray-body">
                      We'll send tracking information when your order ships.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </SlideUp>

          {/* Estimated Delivery */}
          <SlideUp delay={0.3}>
            <Card className="p-6 mb-8 bg-sage-pale/30 border-sage-pale">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-sage" />
                <div>
                  <h4 className="font-medium text-gray-dark">Estimated Delivery</h4>
                  <p className="text-sm text-gray-body">5-7 business days</p>
                </div>
              </div>
            </Card>
          </SlideUp>

          {/* Actions */}
          <SlideUp delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full sm:w-auto">
                  View My Orders
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/shop">
                <Button className="w-full sm:w-auto">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </SlideUp>
        </FadeIn>
      </div>
    </div>
  );
}

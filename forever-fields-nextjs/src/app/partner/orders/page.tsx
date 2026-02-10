"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Badge, Button, Input } from "@/components/ui";
import {
  Package,
  Search,
  Filter,
  Clock,
  Truck,
  CheckCircle,
  MapPin,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

interface PartnerOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  partnerId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  customization?: Record<string, unknown>;
  status: string;
  trackingNumber?: string;
  customerName: string;
  shippingAddress: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  orders: PartnerOrder[];
  total: number;
  stats?: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
  };
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock, label: "Pending" },
  processing: { color: "bg-blue-100 text-blue-700", icon: Package, label: "Processing" },
  shipped: { color: "bg-purple-100 text-purple-700", icon: Truck, label: "Shipped" },
  delivered: { color: "bg-green-100 text-green-700", icon: CheckCircle, label: "Delivered" },
  cancelled: { color: "bg-gray-100 text-gray-700", icon: X, label: "Cancelled" },
};

export default function PartnerOrdersPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";

  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [stats, setStats] = useState<OrdersResponse["stats"]>();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedOrder, setSelectedOrder] = useState<PartnerOrder | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/partners/orders?${params}`, {
        headers: {
          Authorization: "Bearer ff_session_demo",
          "X-Partner-ID": "partner-1",
        },
      });
      const data: OrdersResponse = await response.json();
      setOrders(data.orders || []);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string, trackingNumber?: string) => {
    setUpdating(true);
    try {
      const response = await fetch("/api/partners/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer ff_session_demo",
          "X-Partner-ID": "partner-1",
        },
        body: JSON.stringify({
          orderItemId: orderId,
          status: newStatus,
          trackingNumber,
        }),
      });

      if (response.ok) {
        await fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-sage border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500">Manage and fulfill your orders</p>
      </div>

      {/* Status Tabs */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          {[
            { key: "", label: "All", count: orders.length },
            { key: "pending", label: "Pending", count: stats.pending },
            { key: "processing", label: "Processing", count: stats.processing },
            { key: "shipped", label: "Shipped", count: stats.shipped },
            { key: "delivered", label: "Delivered", count: stats.delivered },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? "primary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  statusFilter === tab.key ? "bg-white/20" : "bg-gray-200"
                }`}>
                  {tab.count}
                </span>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders found</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <Card key={order.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Order Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge className={config.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Product</p>
                        <p className="font-medium text-gray-900">
                          {order.productName} x{order.quantity}
                        </p>
                        <p className="text-sm text-gray-600">
                          ${(order.unitPrice * order.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                      </div>
                    </div>

                    {/* Customization */}
                    {order.customization && Object.keys(order.customization).length > 0 && (
                      <div className="p-3 bg-sage-pale/20 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">Customization</p>
                        <div className="text-sm text-gray-600">
                          {Object.entries(order.customization).map(([key, value]) => (
                            <p key={key}>
                              <span className="capitalize">{key}:</span> {String(value)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipping Address */}
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p>{order.shippingAddress.name}</p>
                        <p>{order.shippingAddress.street1}</p>
                        {order.shippingAddress.street2 && <p>{order.shippingAddress.street2}</p>}
                        <p>
                          {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                          {order.shippingAddress.postalCode}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-700">{order.notes}</p>
                      </div>
                    )}

                    {/* Tracking */}
                    {order.trackingNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Tracking:</span>
                        <span className="font-mono text-gray-900">{order.trackingNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 lg:w-40">
                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        className="flex-1 lg:w-full"
                        onClick={() => updateOrderStatus(order.id, "processing")}
                        disabled={updating}
                      >
                        Start Processing
                      </Button>
                    )}
                    {order.status === "processing" && (
                      <Button
                        size="sm"
                        className="flex-1 lg:w-full"
                        onClick={() => setSelectedOrder(order)}
                        disabled={updating}
                      >
                        Mark Shipped
                      </Button>
                    )}
                    {order.status === "shipped" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 lg:w-full"
                        onClick={() => updateOrderStatus(order.id, "delivered")}
                        disabled={updating}
                      >
                        Mark Delivered
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 lg:w-full"
                      onClick={() => setSelectedOrder(order)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail / Ship Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedOrder.status === "processing" ? "Ship Order" : "Order Details"}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-medium">{selectedOrder.orderNumber}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-medium">
                  {selectedOrder.productName} x{selectedOrder.quantity}
                </p>
              </div>

              {selectedOrder.status === "processing" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <Input
                    id="tracking"
                    placeholder="Enter tracking number"
                    defaultValue={selectedOrder.trackingNumber}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </Button>
                {selectedOrder.status === "processing" && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const tracking = (document.getElementById("tracking") as HTMLInputElement)?.value;
                      updateOrderStatus(selectedOrder.id, "shipped", tracking);
                    }}
                    disabled={updating}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Ship Order
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

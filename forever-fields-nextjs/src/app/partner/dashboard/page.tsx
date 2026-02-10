"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";
import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

interface DashboardData {
  id: string;
  name: string;
  stats: {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
    commission: number;
    commissionPercent: number;
    avgOrderValue: number;
    thisMonthOrders: number;
    thisMonthRevenue: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    productName: string;
    customerName: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
}

export default function PartnerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/partners/dashboard", {
          headers: {
            Authorization: "Bearer ff_session_demo",
            "X-Partner-ID": "partner-1",
          },
        });
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-sage border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Failed to load dashboard</p>
      </div>
    );
  }

  const { stats, recentOrders } = data;

  const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
    processing: { color: "bg-blue-100 text-blue-700", icon: Package },
    shipped: { color: "bg-purple-100 text-purple-700", icon: Truck },
    delivered: { color: "bg-green-100 text-green-700", icon: CheckCircle },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {data.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-sage-pale flex items-center justify-center">
              <Package className="w-6 h-6 text-sage" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gold-pale flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-gold-dark" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-coral-pale flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-coral" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Your Commission</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.commission.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">{stats.commissionPercent}% rate</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-rose-pale flex items-center justify-center">
              <Clock className="w-6 h-6 text-rose" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
          <div className="space-y-4">
            {[
              { label: "Pending", count: stats.pendingOrders, color: "bg-yellow-500" },
              { label: "Processing", count: stats.processingOrders, color: "bg-blue-500" },
              { label: "Shipped", count: stats.shippedOrders, color: "bg-purple-500" },
              { label: "Delivered", count: stats.deliveredOrders, color: "bg-green-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="flex-1 text-gray-600">{item.label}</span>
                <span className="font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Orders Received</span>
              <span className="font-medium text-gray-900">{stats.thisMonthOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Revenue</span>
              <span className="font-medium text-gray-900">
                ${stats.thisMonthRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg. Order Value</span>
              <span className="font-medium text-gray-900">
                ${stats.avgOrderValue.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/partner/orders">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Order
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => {
                  const config = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/partner/orders?order=${order.id}`}
                          className="font-medium text-sage hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{order.productName}</td>
                      <td className="py-3 px-4 text-gray-600">{order.customerName}</td>
                      <td className="py-3 px-4">
                        <Badge className={config.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        ${order.total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      {stats.pendingOrders > 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800">
                You have {stats.pendingOrders} pending order{stats.pendingOrders > 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-yellow-600">
                Review and process these orders to maintain quick fulfillment times.
              </p>
            </div>
            <Link href="/partner/orders?status=pending">
              <Button size="sm">View Pending</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

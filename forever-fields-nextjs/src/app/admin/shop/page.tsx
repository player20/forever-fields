"use client";

import { Card } from "@/components/ui";
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";

// Demo stats - in production these would come from API
const stats = [
  { label: "Total Products", value: "24", icon: Package, color: "sage", href: "/admin/shop/products" },
  { label: "Active Partners", value: "5", icon: Users, color: "gold", href: "/admin/shop/partners" },
  { label: "Orders Today", value: "12", icon: ShoppingCart, color: "coral", href: "/admin/shop/orders" },
  { label: "Revenue (MTD)", value: "$2,450", icon: DollarSign, color: "twilight", href: "/admin/shop/orders" },
];

const recentOrders = [
  { id: "FF-12345", customer: "Sarah M.", total: "$89.00", status: "processing", time: "2 min ago" },
  { id: "FF-12344", customer: "Michael T.", total: "$149.00", status: "shipped", time: "1 hour ago" },
  { id: "FF-12343", customer: "Jennifer R.", total: "$65.00", status: "delivered", time: "3 hours ago" },
  { id: "FF-12342", customer: "David L.", total: "$225.00", status: "paid", time: "5 hours ago" },
];

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};

export default function AdminShopDashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Shop Dashboard</h1>
        <p className="text-gray-500">Overview of your shop performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === "sage" ? "bg-sage-pale" :
                  stat.color === "gold" ? "bg-gold-pale" :
                  stat.color === "coral" ? "bg-coral-pale" :
                  "bg-twilight/10"
                }`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === "sage" ? "text-sage-dark" :
                    stat.color === "gold" ? "text-gold-dark" :
                    stat.color === "coral" ? "text-coral-dark" :
                    "text-twilight"
                  }`} />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/shop/orders" className="text-sm text-sage hover:text-sage-dark">
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-500">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{order.total}</p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/shop/products/new"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-sage hover:bg-sage-pale/20 transition-colors"
            >
              <Package className="w-5 h-5 text-sage" />
              <div>
                <p className="font-medium text-gray-900">Add New Product</p>
                <p className="text-sm text-gray-500">Create a new product listing</p>
              </div>
            </Link>
            <Link
              href="/admin/shop/partners/new"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gold hover:bg-gold-pale/20 transition-colors"
            >
              <Users className="w-5 h-5 text-gold-dark" />
              <div>
                <p className="font-medium text-gray-900">Add Partner</p>
                <p className="text-sm text-gray-500">Connect a fulfillment partner</p>
              </div>
            </Link>
            <Link
              href="/admin/shop/orders?status=pending"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-coral hover:bg-coral-pale/20 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-coral" />
              <div>
                <p className="font-medium text-gray-900">Process Orders</p>
                <p className="text-sm text-gray-500">3 orders need attention</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

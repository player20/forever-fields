"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Package,
  Users,
  ClipboardList,
  Settings,
  BarChart3,
  ChevronLeft,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin/shop", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/shop/products", label: "Products", icon: Package },
  { href: "/admin/shop/partners", label: "Partners", icon: Users },
  { href: "/admin/shop/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/shop/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Site
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sage flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Shop Admin</h1>
              <p className="text-xs text-gray-500">Manage products & orders</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-sage-pale text-sage-dark font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">Forever Fields Admin v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home,
  Heart,
  Plus,
  ShoppingBag,
  Settings,
} from "lucide-react";

interface MobileNavProps {
  className?: string;
}

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Memorials", href: "/memorials", icon: Heart },
  { name: "Create", href: "/create", icon: Plus, isAction: true },
  { name: "Shop", href: "/shop", icon: ShoppingBag },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-white/90 backdrop-blur-lg border-t border-sage-pale/50",
        "safe-area-inset-bottom",
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isAction = item.isAction;

          if (isAction) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shadow-soft"
                >
                  <item.icon className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-xs font-medium text-sage-dark mt-1">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors",
                "min-w-14",
                isActive
                  ? "text-sage-dark"
                  : "text-gray-body hover:text-sage-dark"
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative"
              >
                <item.icon className="w-6 h-6" />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sage"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
              <span
                className={cn(
                  "text-xs mt-1 font-medium",
                  isActive ? "text-sage-dark" : "text-gray-body"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Simple safe area helper CSS (add to globals.css)
// .safe-area-inset-bottom { padding-bottom: env(safe-area-inset-bottom); }

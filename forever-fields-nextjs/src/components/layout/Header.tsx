"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBadge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown";
import {
  Menu,
  X,
  Bell,
  Home,
  Heart,
  ShoppingBag,
  Settings,
  LogOut,
  HelpCircle,
  Flower2,
  Search,
  Plus,
  LayoutDashboard,
  TreeDeciduous,
  CreditCard,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  notifications?: number;
  className?: string;
}

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Memorials", href: "/memorials", icon: Heart },
  { name: "Family Tree", href: "/family-tree", icon: TreeDeciduous },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
  { name: "Shop", href: "/shop", icon: ShoppingBag },
];

export function Header({ user, notifications = 0, className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sage-pale/50",
        className
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shadow-soft group-hover:shadow-hover transition-shadow">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif text-xl font-semibold text-sage-dark hidden sm:block">
                Forever Fields
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sage-pale text-sage-dark"
                      : "text-gray-body hover:text-sage-dark hover:bg-sage-pale/50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher variant="compact" />
            </div>

            {/* Search button */}
            <button
              className="p-2 rounded-lg text-gray-body hover:text-sage-dark hover:bg-sage-pale/50 transition-colors hidden sm:flex"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Create new button */}
            <Link href="/create">
              <Button size="sm" className="hidden sm:flex items-center gap-1">
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">{t("common.createMemorial")}</span>
              </Button>
            </Link>

            {/* Notifications */}
            {user && (
              <button
                className="relative p-2 rounded-lg text-gray-body hover:text-sage-dark hover:bg-sage-pale/50 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5">
                    <NotificationBadge count={notifications} />
                  </span>
                )}
              </button>
            )}

            {/* User menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-sage-pale/50 transition-colors">
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="sm"
                    />
                    <span className="hidden lg:block text-sm font-medium text-gray-dark max-w-24 truncate">
                      {user.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-gray-body font-normal">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard">
                    <DropdownMenuItem>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      {t("common.dashboard")}
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      {t("common.settings")}
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/help">
                    <DropdownMenuItem>
                      <HelpCircle className="w-4 h-4 mr-2" />
                      {t("nav.support")}
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <Link href="/login">
                    <DropdownMenuItem destructive>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("common.logout")}
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t("common.login")}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="hidden sm:flex">
                    {t("common.getStarted")}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-body hover:text-sage-dark hover:bg-sage-pale/50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-1 border-t border-sage-pale/50">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                        isActive
                          ? "bg-sage-pale text-sage-dark"
                          : "text-gray-body hover:text-sage-dark hover:bg-sage-pale/50"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Mobile Create button */}
                <div className="pt-4 px-4">
                  <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" />
                      {t("common.createMemorial")}
                    </Button>
                  </Link>
                </div>

                {/* Mobile Language Switcher */}
                <div className="pt-4 px-4 border-t border-sage-pale/50 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-body">Language</span>
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

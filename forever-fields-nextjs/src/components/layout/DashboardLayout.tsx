"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ToastProvider } from "@/components/ui/Toast";

interface DashboardLayoutProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  notifications?: number;
  showSidebar?: boolean;
  className?: string;
}

export function DashboardLayout({
  children,
  user,
  notifications = 0,
  showSidebar = true,
  className,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-cream">
      <ToastProvider />

      {/* Header - always visible */}
      <Header user={user} notifications={notifications} />

      <div className="flex">
        {/* Sidebar - desktop only */}
        {showSidebar && (
          <div className="hidden md:block sticky top-16 h-[calc(100vh-4rem)]">
            <Sidebar />
          </div>
        )}

        {/* Main content */}
        <main
          className={cn(
            "flex-1 min-h-[calc(100vh-4rem)]",
            "pb-20 md:pb-0", // Extra padding for mobile nav
            className
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation - mobile only */}
      <MobileNav />
    </div>
  );
}

// Page header component for consistent page titles
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-gray-light">/</span>
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-gray-body hover:text-sage-dark transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-dark font-medium">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-dark">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-gray-body">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

// Section component for content grouping
interface SectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn("mb-8", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-lg font-serif font-semibold text-gray-dark">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-gray-body">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

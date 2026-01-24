"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  variant?: "default" | "sage" | "gold" | "twilight";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = "default",
  size = "md",
  className,
}: StatsCardProps) {
  const sizes = {
    sm: {
      container: "p-4",
      icon: "w-8 h-8",
      title: "text-xs",
      value: "text-xl",
      description: "text-xs",
    },
    md: {
      container: "p-5",
      icon: "w-10 h-10",
      title: "text-sm",
      value: "text-2xl",
      description: "text-sm",
    },
    lg: {
      container: "p-6",
      icon: "w-12 h-12",
      title: "text-base",
      value: "text-3xl",
      description: "text-base",
    },
  };

  const variants = {
    default: {
      bg: "bg-white",
      iconBg: "bg-sage-pale/50",
      iconColor: "text-sage",
    },
    sage: {
      bg: "bg-sage-pale/30",
      iconBg: "bg-sage/10",
      iconColor: "text-sage-dark",
    },
    gold: {
      bg: "bg-gold/5",
      iconBg: "bg-gold/10",
      iconColor: "text-gold-dark",
    },
    twilight: {
      bg: "bg-twilight/5",
      iconBg: "bg-twilight/10",
      iconColor: "text-twilight",
    },
  };

  const sizeConfig = sizes[size];
  const variantConfig = variants[variant];

  const TrendIcon =
    trend?.value === 0
      ? Minus
      : trend?.value && trend.value > 0
      ? TrendingUp
      : TrendingDown;

  const trendColor =
    trend?.isPositive !== undefined
      ? trend.isPositive
        ? "text-success"
        : "text-error"
      : trend?.value && trend.value > 0
      ? "text-success"
      : trend?.value && trend.value < 0
      ? "text-error"
      : "text-gray-body";

  return (
    <div
      className={cn(
        "rounded-xl shadow-soft transition-all duration-300 hover:shadow-hover",
        variantConfig.bg,
        sizeConfig.container,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <p
            className={cn(
              "font-medium text-gray-body mb-1",
              sizeConfig.title
            )}
          >
            {title}
          </p>

          {/* Value */}
          <p
            className={cn(
              "font-serif font-bold text-gray-dark",
              sizeConfig.value
            )}
          >
            {value}
          </p>

          {/* Trend & Description */}
          {(trend || description) && (
            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-sm font-medium",
                    trendColor
                  )}
                >
                  <TrendIcon className="w-4 h-4" />
                  {Math.abs(trend.value)}%
                  {trend.label && (
                    <span className="text-gray-body font-normal">
                      {trend.label}
                    </span>
                  )}
                </span>
              )}
              {description && !trend && (
                <span className={cn("text-gray-body", sizeConfig.description)}>
                  {description}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center shrink-0",
              variantConfig.iconBg,
              variantConfig.iconColor,
              sizeConfig.icon
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Grid for multiple cards
interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({
  children,
  columns = 4,
  className,
}: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

// Quick Stats Row (compact inline stats)
interface QuickStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
  }>;
  className?: string;
}

export function QuickStats({ stats, className }: QuickStatsProps) {
  return (
    <div
      className={cn(
        "flex items-center divide-x divide-gray-light/30",
        className
      )}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "flex flex-col text-center px-4 first:pl-0 last:pr-0",
            index === 0 ? "pl-0" : ""
          )}
        >
          <span className="text-lg font-semibold text-gray-dark">
            {stat.value}
          </span>
          <span className="text-xs text-gray-body">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

"use client";

import { forwardRef } from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      max = 100,
      size = "md",
      variant = "default",
      showLabel = false,
      label,
      className,
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    };

    const variants = {
      default: "bg-sage",
      success: "bg-success",
      warning: "bg-gold",
      error: "bg-error",
    };

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {(showLabel || label) && (
          <div className="flex justify-between items-center mb-1.5">
            {label && (
              <span className="text-sm font-medium text-gray-dark">{label}</span>
            )}
            {showLabel && (
              <span className="text-sm text-gray-body">{Math.round(percentage)}%</span>
            )}
          </div>
        )}
        <ProgressPrimitive.Root
          value={value}
          max={max}
          className={cn(
            "relative overflow-hidden rounded-full bg-sage-pale/50",
            sizes[size]
          )}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              variants[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </ProgressPrimitive.Root>
      </div>
    );
  }
);

Progress.displayName = "Progress";

// Circular Progress
interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg" | "xl";
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "error";
  showValue?: boolean;
  className?: string;
}

function CircularProgress({
  value = 0,
  max = 100,
  size = "md",
  strokeWidth = 4,
  variant = "default",
  showValue = false,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-2xl",
  };

  const variants = {
    default: "text-sage",
    success: "text-success",
    warning: "text-gold",
    error: "text-error",
  };

  const diameter = sizes[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: diameter, height: diameter }}
    >
      <svg
        width={diameter}
        height={diameter}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-sage-pale/50"
        />
        {/* Progress circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-500 ease-out", variants[variant])}
        />
      </svg>
      {showValue && (
        <span
          className={cn(
            "absolute font-semibold text-gray-dark",
            textSizes[size]
          )}
        >
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

// Step Progress for wizards/flows
interface StepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                    isCompleted
                      ? "bg-sage text-white"
                      : isCurrent
                      ? "bg-sage-pale text-sage-dark border-2 border-sage"
                      : "bg-gray-light/30 text-gray-body"
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-20",
                    isCurrent ? "text-sage-dark" : "text-gray-body"
                  )}
                >
                  {step}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    isCompleted ? "bg-sage" : "bg-gray-light/30"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Progress, CircularProgress, StepProgress };

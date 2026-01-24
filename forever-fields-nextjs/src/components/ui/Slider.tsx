"use client";

import { forwardRef } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
    "value" | "defaultValue"
  > {
  value?: number[];
  defaultValue?: number[];
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  formatValue?: (value: number) => string;
  label?: string;
  marks?: Array<{ value: number; label: string }>;
}

const Slider = forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      value,
      defaultValue,
      size = "md",
      showValue = false,
      formatValue = (v) => v.toString(),
      label,
      marks,
      min = 0,
      max = 100,
      step = 1,
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: { track: "h-1", thumb: "h-4 w-4" },
      md: { track: "h-2", thumb: "h-5 w-5" },
      lg: { track: "h-3", thumb: "h-6 w-6" },
    };

    const sizeConfig = sizes[size];
    const currentValue = value || defaultValue || [min];

    return (
      <div className={cn("w-full", className)}>
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-2">
            {label && (
              <span className="text-sm font-medium text-gray-dark">{label}</span>
            )}
            {showValue && (
              <span className="text-sm text-gray-body">
                {currentValue.map(formatValue).join(" - ")}
              </span>
            )}
          </div>
        )}

        <SliderPrimitive.Root
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          min={min}
          max={max}
          step={step}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            props.disabled && "opacity-50"
          )}
          {...props}
        >
          <SliderPrimitive.Track
            className={cn(
              "relative w-full grow overflow-hidden rounded-full bg-sage-pale/50",
              sizeConfig.track
            )}
          >
            <SliderPrimitive.Range className="absolute h-full bg-sage rounded-full" />
          </SliderPrimitive.Track>

          {currentValue.map((_, index) => (
            <SliderPrimitive.Thumb
              key={index}
              className={cn(
                "block rounded-full border-2 border-sage bg-white shadow-md ring-offset-white transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                "hover:border-sage-dark hover:shadow-lg",
                "cursor-grab active:cursor-grabbing",
                sizeConfig.thumb
              )}
            />
          ))}
        </SliderPrimitive.Root>

        {marks && marks.length > 0 && (
          <div className="relative w-full mt-2">
            {marks.map((mark) => {
              const position = ((mark.value - min) / (max - min)) * 100;
              return (
                <div
                  key={mark.value}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  <div className="w-1 h-1 bg-gray-light rounded-full mx-auto mb-1" />
                  <span className="text-xs text-gray-body whitespace-nowrap">
                    {mark.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };

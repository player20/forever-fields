"use client";

import React from "react";

interface CheckoutProgressProps {
  currentStep: number; // 0-3 for Address, Shipping, Payment, Review
}

const STEPS = ["Address", "Shipping", "Payment", "Review"];

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {STEPS.map((step, idx) => (
        <React.Fragment key={step}>
          <div className={`flex items-center gap-2 ${idx <= currentStep ? "text-primary-600" : "text-gray-400"}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              idx < currentStep ? "bg-green-600 text-white" : idx === currentStep ? "bg-primary-600 text-white" : "bg-gray-200"
            }`}>
              {idx < currentStep ? "✓" : idx + 1}
            </span>
            <span className="hidden sm:inline">{step}</span>
          </div>
          {idx < 3 && <div className="w-8 h-px bg-gray-300" />}
        </React.Fragment>
      ))}
    </div>
  );
}

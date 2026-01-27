"use client";

import { useState, useMemo } from "react";
import { Button } from "../ui/Button";
import { ProductCard } from "./ProductCard";
import type { Product, ProductCategory } from "@/types/shop";
import { CATEGORY_LABELS } from "@/types/shop";
import { PRODUCT_CATALOG } from "@/data/products";

interface ProductCatalogProps {
  cartItemCount: number;
  onViewCart: () => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductCatalog({
  cartItemCount,
  onViewCart,
  onSelectProduct
}: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return PRODUCT_CATALOG;
    return PRODUCT_CATALOG.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Memorial Shop</h2>
        {cartItemCount > 0 && (
          <Button onClick={onViewCart}>
            View Cart ({cartItemCount})
          </Button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(CATEGORY_LABELS) as Array<ProductCategory | "all">).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={onSelectProduct}
          />
        ))}
      </div>
    </div>
  );
}

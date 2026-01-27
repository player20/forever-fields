"use client";

import { Card } from "../ui/Card";
import type { Product, ProductCategory } from "@/types/shop";
import { formatCurrency } from "@/lib/shop-utils";

const CATEGORY_ICONS: Record<ProductCategory, string> = {
  photo_books: "📖",
  qr_plaques: "🏷️",
  memorial_cards: "📄",
  canvas_prints: "🖼️",
  urns: "⚱️",
  jewelry: "💎",
  keepsakes: "🎁",
  flowers: "💐",
  donations: "🌳"
};

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick(product)}
    >
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
        <span className="text-4xl">
          {CATEGORY_ICONS[product.category]}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900">{product.name}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="font-bold text-primary-600">
          {formatCurrency(product.basePrice)}
          {product.options.length > 0 && "+"}
        </span>
        {!product.inStock && (
          <span className="text-xs text-red-600 font-medium">Out of Stock</span>
        )}
      </div>
      {product.rushAvailable && (
        <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
          Rush Available
        </span>
      )}
    </Card>
  );
}

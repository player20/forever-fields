"use client";

import { Card } from "../ui/Card";
import {
  BookOpen,
  Tag,
  FileText,
  Frame,
  Archive,
  Gem,
  Gift,
  Flower,
  TreeDeciduous,
} from "lucide-react";
import type { Product, ProductCategory } from "@/types/shop";
import { formatCurrency } from "@/lib/shop-utils";

const CATEGORY_ICONS: Record<ProductCategory, React.ComponentType<{ className?: string }>> = {
  photo_books: BookOpen,
  qr_plaques: Tag,
  memorial_cards: FileText,
  canvas_prints: Frame,
  urns: Archive,
  jewelry: Gem,
  keepsakes: Gift,
  flowers: Flower,
  donations: TreeDeciduous
};

function CategoryIcon({ category, className = "w-5 h-5" }: { category: ProductCategory; className?: string }) {
  const Icon = CATEGORY_ICONS[category];
  return Icon ? <Icon className={className} /> : null;
}

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
        <CategoryIcon category={product.category} className="w-10 h-10 text-gray-600" />
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

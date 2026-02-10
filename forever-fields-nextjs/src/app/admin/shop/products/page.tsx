"use client";

import { useState } from "react";
import { Button, Card, Badge, Input } from "@/components/ui";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
} from "lucide-react";
import Link from "next/link";

// Demo products - in production these would come from API
const demoProducts = [
  {
    id: "1",
    name: "Memorial Flower Arrangement",
    category: "flowers",
    price: 75,
    partner: "FlowerCo",
    inStock: true,
    salesCount: 124,
  },
  {
    id: "2",
    name: "Personalized Memorial Stone",
    category: "keepsakes",
    price: 149,
    partner: "StoneCraft",
    inStock: true,
    salesCount: 89,
  },
  {
    id: "3",
    name: "Memory Candle Set",
    category: "keepsakes",
    price: 45,
    partner: null,
    inStock: true,
    salesCount: 156,
  },
  {
    id: "4",
    name: "Digital Photo Frame",
    category: "tech",
    price: 129,
    partner: "TechPartner",
    inStock: false,
    salesCount: 67,
  },
  {
    id: "5",
    name: "Memorial Wind Chime",
    category: "keepsakes",
    price: 65,
    partner: "CraftWorks",
    inStock: true,
    salesCount: 98,
  },
];

const categories = ["all", "flowers", "keepsakes", "tech", "gifts"];

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts = demoProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage your shop products</p>
        </div>
        <Link href="/admin/shop/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "primary" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sage-pale rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-sage" />
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" size="sm">
                      {product.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-900">${product.price}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {product.partner || <span className="text-gray-400">Internal</span>}
                  </td>
                  <td className="px-6 py-4">
                    {product.inStock ? (
                      <Badge variant="default" size="sm" className="bg-green-100 text-green-700">
                        In Stock
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm" className="bg-red-100 text-red-700">
                        Out of Stock
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{product.salesCount}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/shop?preview=${product.id}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="Preview">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </Link>
                      <Link href={`/admin/shop/products/${product.id}`}>
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                      </Link>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products found</p>
            <Link href="/admin/shop/products/new">
              <Button variant="outline" size="sm" className="mt-4">
                Add your first product
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

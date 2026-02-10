"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Badge } from "@/components/ui";
import { ChevronLeft, Save, ImagePlus, X } from "lucide-react";
import Link from "next/link";

const categories = [
  { value: "flowers", label: "Flowers" },
  { value: "keepsakes", label: "Keepsakes" },
  { value: "jewelry", label: "Jewelry" },
  { value: "tech", label: "Tech" },
  { value: "gifts", label: "Gifts" },
  { value: "donations", label: "Donations" },
];

const fulfillmentTypes = [
  { value: "internal", label: "Internal (Forever Fields fulfills)" },
  { value: "partner", label: "Partner (External fulfillment)" },
  { value: "digital", label: "Digital Product" },
  { value: "donation", label: "Donation" },
];

// Demo partners - in production from API
const partners = [
  { id: "1", name: "FlowerCo" },
  { id: "2", name: "StoneCraft" },
  { id: "3", name: "TechPartner" },
  { id: "4", name: "CraftWorks" },
];

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "keepsakes",
    basePrice: "",
    compareAtPrice: "",
    costPrice: "",
    fulfillmentType: "partner",
    partnerId: "",
    productionDays: "3",
    inStock: true,
    isCustomizable: false,
    rushAvailable: false,
    rushDays: "",
    rushPriceMultiplier: "",
    weight: "",
    freeShipping: false,
    images: [] as string[],
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/shop/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/admin/shop/products");
      }
    } catch (error) {
      console.error("Error creating product:", error);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/shop/products"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-500">Create a new product for your shop</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Memorial Flower Arrangement"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <Input
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief description for product cards"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed product description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="0.00"
                  className="pl-7"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare at Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Original price if on sale</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">What you pay the partner</p>
            </div>
          </div>
        </Card>

        {/* Fulfillment */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fulfillment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fulfillment Type *
              </label>
              <select
                value={formData.fulfillmentType}
                onChange={(e) => setFormData({ ...formData, fulfillmentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
              >
                {fulfillmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.fulfillmentType === "partner" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner
                </label>
                <select
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                >
                  <option value="">Select a partner...</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Production Days
                </label>
                <Input
                  type="number"
                  value={formData.productionDays}
                  onChange={(e) => setFormData({ ...formData, productionDays: e.target.value })}
                  placeholder="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (lbs)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-sage focus:ring-sage"
                />
                <span className="text-sm text-gray-700">In Stock</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.freeShipping}
                  onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-sage focus:ring-sage"
                />
                <span className="text-sm text-gray-700">Free Shipping</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCustomizable}
                  onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-sage focus:ring-sage"
                />
                <span className="text-sm text-gray-700">Customizable</span>
              </label>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rushAvailable}
                onChange={(e) => setFormData({ ...formData, rushAvailable: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-sage focus:ring-sage"
              />
              <span className="text-sm text-gray-700">Rush Order Available</span>
            </label>

            {formData.rushAvailable && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rush Days
                  </label>
                  <Input
                    type="number"
                    value={formData.rushDays}
                    onChange={(e) => setFormData({ ...formData, rushDays: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rush Price Multiplier
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.rushPriceMultiplier}
                    onChange={(e) => setFormData({ ...formData, rushPriceMultiplier: e.target.value })}
                    placeholder="1.5"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Images */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <ImagePlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Drag and drop images here, or click to upload</p>
            <Button type="button" variant="outline" size="sm">
              Choose Files
            </Button>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/shop/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}

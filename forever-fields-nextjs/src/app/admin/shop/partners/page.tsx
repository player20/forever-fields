"use client";

import { useState } from "react";
import { Button, Card, Badge, Input } from "@/components/ui";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";
import Link from "next/link";

// Demo partners - in production these would come from API
const demoPartners = [
  {
    id: "1",
    name: "FlowerCo",
    slug: "flowerco",
    contactEmail: "orders@flowerco.com",
    websiteUrl: "https://flowerco.com",
    shopifyStoreUrl: "flowerco.myshopify.com",
    isActive: true,
    verifiedAt: "2024-01-15",
    productCount: 8,
    orderCount: 245,
    commissionPercent: 15,
  },
  {
    id: "2",
    name: "StoneCraft Memorial",
    slug: "stonecraft",
    contactEmail: "partners@stonecraft.com",
    websiteUrl: "https://stonecraft.com",
    shopifyStoreUrl: null,
    webhookUrl: "https://stonecraft.com/api/orders",
    isActive: true,
    verifiedAt: "2024-02-01",
    productCount: 12,
    orderCount: 156,
    commissionPercent: 20,
  },
  {
    id: "3",
    name: "TechPartner",
    slug: "techpartner",
    contactEmail: "hello@techpartner.io",
    websiteUrl: "https://techpartner.io",
    shopifyStoreUrl: null,
    isActive: false,
    verifiedAt: null,
    productCount: 3,
    orderCount: 45,
    commissionPercent: 10,
  },
];

export default function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPartners = demoPartners.filter((partner) =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
          <p className="text-gray-500">Manage fulfillment partners</p>
        </div>
        <Link href="/admin/shop/partners/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search partners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => (
          <Card key={partner.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-sage-pale flex items-center justify-center text-lg font-bold text-sage-dark">
                  {partner.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                  <p className="text-sm text-gray-500">{partner.contactEmail}</p>
                </div>
              </div>
              {partner.isActive ? (
                <Badge variant="default" size="sm" className="bg-green-100 text-green-700">
                  Active
                </Badge>
              ) : (
                <Badge variant="default" size="sm" className="bg-gray-100 text-gray-600">
                  Inactive
                </Badge>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Products</span>
                <span className="font-medium text-gray-900">{partner.productCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Orders Fulfilled</span>
                <span className="font-medium text-gray-900">{partner.orderCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Commission</span>
                <span className="font-medium text-gray-900">{partner.commissionPercent}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Integration</span>
                <span className="font-medium text-gray-900">
                  {partner.shopifyStoreUrl ? "Shopify" : partner.webhookUrl ? "Webhook" : "Email"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1 text-sm">
                {partner.verifiedAt ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600">Pending</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {partner.websiteUrl && (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Visit Website"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                )}
                <Link href={`/admin/shop/partners/${partner.id}`}>
                  <button className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                </Link>
                <button className="p-2 hover:bg-gray-100 rounded-lg" title="Delete">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No partners found</p>
          <Link href="/admin/shop/partners/new">
            <Button variant="outline" size="sm" className="mt-4">
              Add your first partner
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

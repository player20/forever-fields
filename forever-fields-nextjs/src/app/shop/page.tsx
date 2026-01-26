"use client";

import { motion } from "framer-motion";
import { Button, Card, Badge } from "@/components/ui";
import { Header } from "@/components/layout";
import { FadeIn, SlideUp, Stagger, StaggerItem } from "@/components/motion";
import {
  ShoppingBag,
  Flower2,
  Gift,
  Heart,
  Star,
  Truck,
  Shield,
  Clock,
} from "lucide-react";
import { useState } from "react";

// Sample products
const products = [
  {
    id: "1",
    name: "Memorial Flower Arrangement",
    description: "Beautiful seasonal flowers delivered to the gravesite",
    price: 75,
    category: "flowers",
    rating: 4.9,
    reviews: 124,
    image: "🌸",
  },
  {
    id: "2",
    name: "Personalized Memorial Stone",
    description: "Custom engraved stone with name and dates",
    price: 149,
    category: "keepsakes",
    rating: 4.8,
    reviews: 89,
    image: "🪨",
  },
  {
    id: "3",
    name: "Memory Candle Set",
    description: "Set of 3 memorial candles with custom labels",
    price: 45,
    category: "candles",
    rating: 4.7,
    reviews: 156,
    image: "🕯️",
  },
  {
    id: "4",
    name: "Digital Photo Frame",
    description: "WiFi-enabled frame that syncs with memorial photos",
    price: 129,
    category: "tech",
    rating: 4.9,
    reviews: 67,
    image: "🖼️",
  },
  {
    id: "5",
    name: "Memorial Wind Chime",
    description: "Handcrafted wind chime with personalized message",
    price: 65,
    category: "keepsakes",
    rating: 4.8,
    reviews: 98,
    image: "🎐",
  },
  {
    id: "6",
    name: "Sympathy Gift Basket",
    description: "Thoughtful care package for grieving families",
    price: 89,
    category: "gifts",
    rating: 4.9,
    reviews: 112,
    image: "🧺",
  },
  {
    id: "7",
    name: "Memorial Tree Planting",
    description: "Plant a tree in their memory in a certified forest",
    price: 50,
    category: "eco",
    rating: 5.0,
    reviews: 203,
    image: "🌳",
  },
  {
    id: "8",
    name: "Custom Memorial Book",
    description: "Hardcover book with photos and memories from the memorial",
    price: 79,
    category: "keepsakes",
    rating: 4.9,
    reviews: 145,
    image: "📖",
  },
];

const categories = [
  { id: "all", name: "All Items", icon: ShoppingBag },
  { id: "flowers", name: "Flowers", icon: Flower2 },
  { id: "keepsakes", name: "Keepsakes", icon: Heart },
  { id: "gifts", name: "Gifts", icon: Gift },
];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sage-pale/50 to-cream py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto">
              <Badge
                variant="outline"
                pill
                icon={<ShoppingBag className="w-4 h-4" />}
                className="mb-4"
              >
                Memorial Shop
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-dark mb-4">
                Meaningful Tributes
              </h1>
              <p className="text-lg text-gray-body mb-8">
                Find thoughtful gifts, flowers, and keepsakes to honor their memory.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-white border-y border-sage-pale/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: Truck, text: "Free Delivery" },
              { icon: Shield, text: "Secure Payment" },
              { icon: Clock, text: "Same Day Shipping" },
              { icon: Heart, text: "With Care" },
            ].map((item) => (
              <div key={item.text} className="flex items-center justify-center gap-2">
                <item.icon className="w-5 h-5 text-sage" />
                <span className="text-sm font-medium text-gray-dark">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "primary" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Stagger staggerDelay={0.05}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <StaggerItem key={product.id}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full overflow-hidden hover:shadow-hover transition-shadow cursor-pointer">
                      <div className="aspect-square bg-sage-pale/30 flex items-center justify-center">
                        <span className="text-6xl">{product.image}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif font-semibold text-gray-dark mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-body mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="w-4 h-4 text-gold fill-current" />
                          <span className="text-sm font-medium text-gray-dark">
                            {product.rating}
                          </span>
                          <span className="text-sm text-gray-body">
                            ({product.reviews})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-sage-dark">
                            ${product.price}
                          </span>
                          <Button size="sm">Add to Cart</Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </StaggerItem>
              ))}
            </div>
          </Stagger>
        </div>
      </section>

      {/* Gift Cards CTA */}
      <section className="py-16 bg-gradient-to-r from-sage-pale/50 to-gold/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SlideUp>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Gift className="w-8 h-8 text-sage" />
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-dark">
                Gift Cards Available
              </h2>
            </div>
            <p className="text-gray-body mb-6">
              Not sure what to give? Let them choose with a Forever Fields gift card.
            </p>
            <Button size="lg">Purchase Gift Card</Button>
          </SlideUp>
        </div>
      </section>
    </div>
  );
}

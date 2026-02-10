"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  Flower,
  Circle,
  Flame,
  Frame,
  Wind,
  ShoppingBasket,
  TreeDeciduous,
  BookOpen,
  ShoppingCart,
  X,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useShopCart, type ShopProduct } from "@/hooks/useShopCart";

// Sample products
const products: Array<{
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  reviews: number;
  icon: LucideIcon;
}> = [
  {
    id: "1",
    name: "Memorial Flower Arrangement",
    description: "Beautiful seasonal flowers delivered to the gravesite",
    price: 75,
    category: "flowers",
    rating: 4.9,
    reviews: 124,
    icon: Flower,
  },
  {
    id: "2",
    name: "Personalized Memorial Stone",
    description: "Custom engraved stone with name and dates",
    price: 149,
    category: "keepsakes",
    rating: 4.8,
    reviews: 89,
    icon: Circle,
  },
  {
    id: "3",
    name: "Memory Candle Set",
    description: "Set of 3 memorial candles with custom labels",
    price: 45,
    category: "candles",
    rating: 4.7,
    reviews: 156,
    icon: Flame,
  },
  {
    id: "4",
    name: "Digital Photo Frame",
    description: "WiFi-enabled frame that syncs with memorial photos",
    price: 129,
    category: "tech",
    rating: 4.9,
    reviews: 67,
    icon: Frame,
  },
  {
    id: "5",
    name: "Memorial Wind Chime",
    description: "Handcrafted wind chime with personalized message",
    price: 65,
    category: "keepsakes",
    rating: 4.8,
    reviews: 98,
    icon: Wind,
  },
  {
    id: "6",
    name: "Sympathy Gift Basket",
    description: "Thoughtful care package for grieving families",
    price: 89,
    category: "gifts",
    rating: 4.9,
    reviews: 112,
    icon: ShoppingBasket,
  },
  {
    id: "7",
    name: "Memorial Tree Planting",
    description: "Plant a tree in their memory in a certified forest",
    price: 50,
    category: "eco",
    rating: 5.0,
    reviews: 203,
    icon: TreeDeciduous,
  },
  {
    id: "8",
    name: "Custom Memorial Book",
    description: "Hardcover book with photos and memories from the memorial",
    price: 79,
    category: "keepsakes",
    rating: 4.9,
    reviews: 145,
    icon: BookOpen,
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
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const { items, itemCount, subtotal, addItem, removeItem, isLoaded } = useShopCart();

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handleAddToCart = useCallback((product: typeof products[0]) => {
    const shopProduct: ShopProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      rating: product.rating,
      reviews: product.reviews,
    };
    addItem(shopProduct);
    setAddedProductId(product.id);
    setShowCartPreview(true);
    setTimeout(() => setAddedProductId(null), 2000);
  }, [addItem]);

  const handleCheckout = useCallback(async () => {
    const cartItems = items.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      description: item.product.description,
      price: item.product.price,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch("/api/stripe/shop-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  }, [items]);

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Floating Cart Button */}
      {isLoaded && itemCount > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowCartPreview(!showCartPreview)}
          className="fixed bottom-6 right-6 z-50 bg-sage text-white p-4 rounded-full shadow-lg hover:bg-sage-dark transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-coral text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        </motion.button>
      )}

      {/* Cart Preview Sidebar */}
      <AnimatePresence>
        {showCartPreview && items.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartPreview(false)}
              className="fixed inset-0 bg-black/30 z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-serif font-bold text-gray-dark">Your Cart</h2>
                  <button
                    onClick={() => setShowCartPreview(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-sage-pale/20 rounded-lg">
                      <div className="w-16 h-16 bg-sage-pale/50 rounded-lg flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-6 h-6 text-sage" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-dark truncate">{item.product.name}</h4>
                        <p className="text-sm text-gray-body">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-sage-dark">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-4">
                    <span className="font-medium text-gray-dark">Subtotal</span>
                    <span className="font-bold text-sage-dark">${subtotal.toFixed(2)}</span>
                  </div>
                  <Button onClick={handleCheckout} className="w-full" size="lg">
                    Checkout
                  </Button>
                  <button
                    onClick={() => setShowCartPreview(false)}
                    className="w-full mt-2 text-sm text-gray-body hover:text-gray-dark"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-gold-pale/40 via-cream to-rose-pale/30 py-16">
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
              { icon: Truck, text: "Free Delivery", color: "sage" },
              { icon: Shield, text: "Secure Payment", color: "gold" },
              { icon: Clock, text: "Same Day Shipping", color: "coral" },
              { icon: Heart, text: "With Care", color: "rose" },
            ].map((item) => (
              <div key={item.text} className="flex items-center justify-center gap-2">
                <item.icon className={`w-5 h-5 ${
                  item.color === "sage" ? "text-sage-dark" :
                  item.color === "gold" ? "text-gold-dark" :
                  item.color === "coral" ? "text-coral" :
                  "text-rose"
                }`} />
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
                        <product.icon className="w-16 h-16 text-sage" />
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/shop/${product.id}`;
                              }}
                            >
                              Customize
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              variant={addedProductId === product.id ? "secondary" : "primary"}
                            >
                              {addedProductId === product.id ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Added
                                </>
                              ) : (
                                "Add"
                              )}
                            </Button>
                          </div>
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

      {/* Gift of Remembrance CTA */}
      <section className="py-16 bg-gradient-to-r from-coral-pale/40 to-gold-pale/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SlideUp>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-coral-dark" />
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-dark">
                Give the Gift of Remembrance
              </h2>
            </div>
            <p className="text-gray-body mb-6 max-w-xl mx-auto">
              Support a grieving family by giving them the choice. A memorial gift card
              lets them select meaningful tributes when they&apos;re ready.
            </p>
            <Button size="lg">Send a Memorial Gift Card</Button>
          </SlideUp>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Card, Badge } from "@/components/ui";
import { Header } from "@/components/layout";
import { ProductCustomizer, type ProductCustomization } from "@/components/shop/ProductCustomizer";
import { useShopCart, type ShopProduct } from "@/hooks/useShopCart";
import { PRODUCT_CATALOG } from "@/data/products";
import { toast } from "sonner";
import {
  ArrowLeft,
  Truck,
  Shield,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
} from "lucide-react";
import type { Product } from "@/types/shop";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ memorial?: string }>;
}

export default function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const router = useRouter();
  const { productId } = use(params);
  const { memorial: memorialId } = use(searchParams);
  const { addItem } = useShopCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Find product from catalog
  useEffect(() => {
    const found = PRODUCT_CATALOG.find((p) => p.id === productId);
    setProduct(found || null);
  }, [productId]);

  const handleAddToCart = async (customization: ProductCustomization) => {
    if (!product) return;

    setIsAddingToCart(true);

    // Simulate brief delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Convert to ShopProduct format
    const shopProduct: ShopProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: customization.calculatedPrice,
      category: product.category,
    };

    // Build customization object for cart
    const cartCustomization = {
      memorialId,
      engraving: Object.entries(customization.textFields)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; "),
      photoUrl: customization.photos[0]?.url,
      notes: `Options: ${Object.entries(customization.selectedOptions)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}${customization.isRush ? " | RUSH ORDER" : ""}`,
    };

    addItem(shopProduct, customization.quantity, cartCustomization);

    toast.success("Added to cart!", {
      description: `${product.name} has been added to your cart`,
      action: {
        label: "View Cart",
        onClick: () => router.push("/shop?view=cart"),
      },
    });

    setIsAddingToCart(false);
  };

  const handleNextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-serif font-bold text-gray-dark mb-4">
            Product Not Found
          </h1>
          <p className="text-gray-body mb-8">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/shop">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-sage-pale/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/shop" className="text-gray-muted hover:text-sage">
              Shop
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              href={`/shop?category=${product.category}`}
              className="text-gray-muted hover:text-sage capitalize"
            >
              {product.category.replace(/_/g, " ")}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-dark">{product.name}</span>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-soft"
            >
              {product.images.length > 0 ? (
                <>
                  <Image
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-soft flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-soft flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.rushAvailable && (
                  <Badge variant="secondary" className="bg-coral text-white">
                    Rush Available
                  </Badge>
                )}
                {!product.inStock && (
                  <Badge variant="secondary" className="bg-gray-500 text-white">
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="w-10 h-10 rounded-full bg-white/90 shadow-soft flex items-center justify-center hover:bg-white transition-colors">
                  <Heart className="w-5 h-5 text-gray-body" />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/90 shadow-soft flex items-center justify-center hover:bg-white transition-colors">
                  <Share2 className="w-5 h-5 text-gray-body" />
                </button>
              </div>
            </motion.div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      idx === currentImageIndex
                        ? "border-sage"
                        : "border-transparent hover:border-sage-light"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Product Info Card - Desktop */}
            <Card className="p-6 hidden lg:block">
              <h2 className="font-semibold text-gray-dark mb-4">Product Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-muted">Production Time</span>
                  <span className="text-gray-dark">{product.productionDays} business days</span>
                </div>
                {product.rushAvailable && product.rushDays && (
                  <div className="flex justify-between">
                    <span className="text-gray-muted">Rush Production</span>
                    <span className="text-coral">{product.rushDays} business days</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between">
                    <span className="text-gray-muted">Dimensions</span>
                    <span className="text-gray-dark">
                      {product.dimensions.width}&quot; × {product.dimensions.height}&quot;
                      {product.dimensions.depth > 0 && ` × ${product.dimensions.depth}"`}
                    </span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between">
                    <span className="text-gray-muted">Weight</span>
                    <span className="text-gray-dark">{product.weight} oz</span>
                  </div>
                )}
                {product.requiresProofApproval && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Check className="w-4 h-4 text-sage" />
                    <span className="text-gray-body">Proof approval required</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Product Info & Customizer */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-dark mb-2">
                {product.name}
              </h1>
              <p className="text-gray-body mb-4">{product.description}</p>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-sage-dark">
                  ${product.basePrice.toFixed(2)}
                </span>
                <span className="text-gray-muted">starting price</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg">
                <Truck className="w-5 h-5 text-sage mb-1" />
                <span className="text-xs text-gray-body">Free Shipping</span>
                <span className="text-xs text-gray-muted">Orders $75+</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg">
                <Shield className="w-5 h-5 text-sage mb-1" />
                <span className="text-xs text-gray-body">Quality Promise</span>
                <span className="text-xs text-gray-muted">100% Satisfaction</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg">
                <Clock className="w-5 h-5 text-sage mb-1" />
                <span className="text-xs text-gray-body">Fast Production</span>
                <span className="text-xs text-gray-muted">{product.productionDays} days</span>
              </div>
            </div>

            {/* Customizer */}
            <ProductCustomizer
              product={product}
              onAddToCart={handleAddToCart}
              memorialId={memorialId}
              isLoading={isAddingToCart}
            />

            {/* Memorial Link Banner */}
            {memorialId && (
              <Card className="p-4 bg-sage-pale/30 border-sage">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-sage mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-dark">
                      Linked to Your Memorial
                    </p>
                    <p className="text-sm text-gray-body">
                      This product will include a QR code that links directly to your memorial page,
                      allowing anyone to visit and contribute.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

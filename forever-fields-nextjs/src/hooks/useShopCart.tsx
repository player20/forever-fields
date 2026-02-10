"use client";

import { useCallback, useEffect, useState, useMemo } from "react";

// Simplified product for shop page
export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating?: number;
  reviews?: number;
}

export interface ShopCartItem {
  id: string;
  product: ShopProduct;
  quantity: number;
  customization?: {
    memorialId?: string;
    engraving?: string;
    photoUrl?: string;
    notes?: string;
  };
}

interface ShopCartState {
  items: ShopCartItem[];
  lastUpdated: number;
}

const CART_STORAGE_KEY = "forever-fields-cart";

function loadCartFromStorage(): ShopCartState {
  if (typeof window === "undefined") {
    return { items: [], lastUpdated: 0 };
  }
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ShopCartState;
      // Expire cart after 7 days
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.lastUpdated > sevenDaysMs) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return { items: [], lastUpdated: 0 };
      }
      return parsed;
    }
  } catch {
    // Invalid storage data
  }
  return { items: [], lastUpdated: 0 };
}

function saveCartToStorage(state: ShopCartState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or disabled
  }
}

export function useShopCart() {
  const [items, setItems] = useState<ShopCartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = loadCartFromStorage();
    setItems(stored.items);
    setIsLoaded(true);
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (!isLoaded) return;
    saveCartToStorage({ items, lastUpdated: Date.now() });
  }, [items, isLoaded]);

  const addItem = useCallback(
    (product: ShopProduct, quantity = 1, customization?: ShopCartItem["customization"]) => {
      setItems((prev) => {
        // Check if same product with same customization exists
        const existingIndex = prev.findIndex(
          (item) =>
            item.product.id === product.id &&
            JSON.stringify(item.customization) === JSON.stringify(customization)
        );

        if (existingIndex >= 0) {
          // Update quantity
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        }

        // Add new item
        const newItem: ShopCartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity,
          customization,
        };
        return [...prev, newItem];
      });
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const updateCustomization = useCallback(
    (itemId: string, customization: ShopCartItem["customization"]) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, customization } : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  const getItemById = useCallback(
    (itemId: string) => items.find((item) => item.id === itemId),
    [items]
  );

  const hasProduct = useCallback(
    (productId: string) => items.some((item) => item.product.id === productId),
    [items]
  );

  return {
    items,
    itemCount,
    subtotal,
    isLoaded,
    addItem,
    removeItem,
    updateQuantity,
    updateCustomization,
    clearCart,
    getItemById,
    hasProduct,
  };
}

// Cart context for global access
import { createContext, useContext, type ReactNode } from "react";

type ShopCartContextValue = ReturnType<typeof useShopCart>;

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const cart = useShopCart();
  return (
    <ShopCartContext.Provider value={cart}>{children}</ShopCartContext.Provider>
  );
}

export function useShopCartContext() {
  const context = useContext(ShopCartContext);
  if (!context) {
    throw new Error("useShopCartContext must be used within ShopCartProvider");
  }
  return context;
}

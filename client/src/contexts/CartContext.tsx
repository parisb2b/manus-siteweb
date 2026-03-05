import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics";

export type CartItem = {
  id: string;
  name: string;
  price: string;
  image: string;
  quantity: number;
  type: "machine" | "accessory" | "house";
  houseConfig?: {
    size: string;
    options: string[];
  };
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("rippa_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart items", e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("rippa_cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: Omit<CartItem, "quantity">) => {
    setItems((prevItems) => {
      // For houses, create a unique cart ID based on configuration
      const cartId = newItem.type === "house" && newItem.houseConfig
        ? `${newItem.id}-${newItem.houseConfig.size}-${newItem.houseConfig.options.sort().join(",")}`
        : newItem.id;

      const existingItem = prevItems.find((item) => {
        if (item.type === "house" && item.houseConfig && newItem.type === "house" && newItem.houseConfig) {
          const existingCartId = `${item.id}-${item.houseConfig.size}-${item.houseConfig.options.sort().join(",")}`;
          return existingCartId === cartId;
        }
        return item.id === newItem.id;
      });

      if (existingItem) {
        return prevItems.map((item) => {
          if (item.type === "house" && item.houseConfig && newItem.type === "house" && newItem.houseConfig) {
            const existingCartId = `${item.id}-${item.houseConfig.size}-${item.houseConfig.options.sort().join(",")}`;
            return existingCartId === cartId ? { ...item, quantity: item.quantity + 1 } : item;
          }
          return item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item;
        });
      }
      return [...prevItems, { ...newItem, quantity: 1 }];
    });
    trackAddToCart(newItem.id, newItem.name, newItem.price, 1);
  };

  const removeFromCart = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) trackRemoveFromCart(item.id, item.name);
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

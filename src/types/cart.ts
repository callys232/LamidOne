// types/cart.ts
export interface CartProduct {
  id: string;
  _id?: string; // Database id
  name: string;
  description?: string;
  imageUrl: string;
  price: number;
  quantity: number;
  category?: string;
  brand?: string;
  sku?: string;
  rating?: number;
  inStock?: boolean;
}

export interface CartContextType {
  cart: CartProduct[];
  addToCart: (item: CartProduct) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  isOpen: boolean;
}

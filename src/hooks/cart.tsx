import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
  totalValue(): number;
  totalItems(): number;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.removeItem('@GoMarketplace:products');

      const productsStoraged = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsStoraged) {
        setProducts(JSON.parse(productsStoraged));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productInCart = products.find(
        currentProduct => currentProduct.id === product.id,
      );

      console.log(productInCart);

      const newProducts = productInCart
        ? products.map(currentProduct =>
            currentProduct.id === product.id
              ? { ...currentProduct, quantity: currentProduct.quantity + 1 }
              : currentProduct,
          )
        : [...products, { ...product, quantity: 1 }];

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product => {
        if (product.id === id) {
          const productUpdated = product;

          productUpdated.quantity += 1;

          return productUpdated;
        }
        return product;
      });

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let newProducts = products.map(product => {
        if (product.id === id) {
          const productUpdated = product;

          productUpdated.quantity -= 1;

          return productUpdated.quantity > 0 ? productUpdated : ({} as Product);
        }
        return product;
      });

      newProducts = newProducts.filter(product => product.quantity > 0);

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const totalValue = useCallback(() => {
    const totalValueInCart = products.reduce((total, product) => {
      const totalOfItem = product.price * product.quantity;
      return total + totalOfItem;
    }, 0);

    return totalValueInCart || 0;
  }, [products]);

  const totalItems = useCallback(() => {
    const totalItemsInCart = products.reduce((total, product) => {
      return total + product.quantity;
    }, 0);

    return totalItemsInCart || 0;
  }, [products]);

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
      totalValue,
      totalItems,
    }),
    [products, addToCart, increment, decrement, totalValue, totalItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

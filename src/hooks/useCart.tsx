import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => Promise<void>;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const productIsOnStock = await api.get(`stock/${productId}`);
      const product = await api.get(`products/${productId}`);

      let cartItemFound = newCart.find((cartItem) => cartItem.id === productId);

      if (cartItemFound) {
        if (cartItemFound.amount >= productIsOnStock.data.amount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }
        cartItemFound.amount += 1;
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        newCart.push({ ...product.data, amount: 1 });
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch (err) {
      toast.error(`Erro na adição do produto`);
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const cartItemFound = newCart.find(
        (cartItem) => cartItem.id === productId
      );
      if (cartItemFound) {
        const listWithoutExcludedItem = newCart.filter(
          (cartItem) => cartItem.id !== productId
        );
        setCart(listWithoutExcludedItem);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(listWithoutExcludedItem)
        );
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        throw new Error();
      }
      const productIsOnStock = await api.get(`stock/${productId}`);
      const productAmoutInStock = productIsOnStock.data.amount;

      if (amount > productAmoutInStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const newCart = [...cart];

      const cartItemFound = newCart.find(
        (cartItem) => cartItem.id === productId
      );
      if (cartItemFound) {
        cartItemFound.amount = amount;
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addProduct,
        removeProduct,
        updateProductAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

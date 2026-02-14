"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);

      if (u) {
        const snapshot = await getDocs(
          collection(db, "users", u.uid, "cart")
        );

        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCartItems(list);
      } else {
        setCartItems([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const addToCart = async (product) => {
    if (!user) return;

    await addDoc(
      collection(db, "users", user.uid, "cart"),
      {
        productId: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        size: product.size,
      }
    );
  };

  const removeFromCart = async (cartId) => {
    if (!user) return;

    await deleteDoc(
      doc(db, "users", user.uid, "cart", cartId)
    );
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
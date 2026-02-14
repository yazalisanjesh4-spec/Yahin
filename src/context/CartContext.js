"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsubscribeCart;

    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);

      if (!u) {
        setCartItems([]);
        return;
      }

      const cartRef = collection(db, "users", u.uid, "cart");

      unsubscribeCart = onSnapshot(cartRef, (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id, // 🔥 this is productId
          ...doc.data(),
        }));

        setCartItems(list);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeCart) unsubscribeCart();
    };
  }, []);

  // ✅ Add to cart (uses productId as document ID)
  const addToCart = async (product) => {
    if (!user) {
      console.log("No user logged in");
      return;
    }

    try {
      await setDoc(
        doc(db, "users", user.uid, "cart", product.id),
        {
          productId: product.id,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          size: product.size || "N/A",
        }
      );

      console.log("Added to cart ✅");
    } catch (error) {
      console.error("Cart error ❌", error);
    }
  };

  // ✅ Remove from cart
  const removeFromCart = async (productId) => {
    if (!user) return;

    try {
      await deleteDoc(
        doc(db, "users", user.uid, "cart", productId)
      );
    } catch (error) {
      console.error("Remove error ❌", error);
    }
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
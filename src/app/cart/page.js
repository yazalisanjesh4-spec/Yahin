"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =============================
     AUTH CHECK
  ============================== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });

    return () => unsub();
  }, [router]);

  /* =============================
     REALTIME CART LISTENER
  ============================== */
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "cart"),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCartItems(items);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price,
    0
  );

  /* =============================
     REMOVE ITEM
  ============================== */
  const handleRemove = async (id) => {
    await deleteDoc(
      doc(db, "users", user.uid, "cart", id)
    );
  };

  /* =============================
     UI
  ============================== */

  if (loading) {
    return (
      <div className="text-center py-20">
        Loading...
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold">
          Your cart is empty
        </h2>
        <Link
          href="/"
          className="text-green-600 font-semibold mt-4 inline-block"
        >
          Go shopping →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* CART ITEMS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <h2 className="font-semibold mb-4">
          Your Cart
        </h2>

        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 mb-4"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-20 h-20 object-contain rounded-lg border"
            />

            <div className="flex-1">
              <p className="font-medium">
                {item.title}
              </p>
              <p className="text-sm text-gray-500">
                Size: {item.size}
              </p>
              <p className="text-sm font-semibold mt-1">
                ₹{item.price}
              </p>

              
            </div>

            <button
              onClick={() => handleRemove(item.id)}
              className="text-red-500 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        ))}

        <div className="flex justify-between font-bold mt-4 text-lg">
          <span>Total</span>
          <span>₹{totalAmount}</span>
        </div>
      </div>

      {/* CHECKOUT BUTTON */}
      <Link
        href="/checkout"
        className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-semibold"
      >
        Proceed to Checkout
      </Link>

    </div>
  );
}
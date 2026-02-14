"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  runTransaction,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  /* =============================
     AUTH FIX (NO LOOP)
  ============================== */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loadingAuth && !currentUser) {
      router.push("/login");
    }
  }, [loadingAuth, currentUser, router]);

  /* =============================
     FETCH CART (Firestore)
  ============================== */
  useEffect(() => {
    if (!currentUser) return;

    const fetchCart = async () => {
      const snapshot = await getDocs(
        collection(db, "users", currentUser.uid, "cart")
      );

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCartItems(list);
    };

    fetchCart();
  }, [currentUser]);

  /* =============================
     FETCH ADDRESSES
  ============================== */
  useEffect(() => {
    if (!currentUser) return;

    const fetchAddresses = async () => {
      const snapshot = await getDocs(
        collection(db, "users", currentUser.uid, "addresses")
      );

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAddresses(list);

      if (list.length > 0) {
        setSelectedAddress(list[0]);
      }
    };

    fetchAddresses();
  }, [currentUser]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price,
    0
  );

  /* =============================
     ATOMIC ORDER (TRANSACTION)
  ============================== */
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert("Please select delivery address");
      return;
    }

    try {
      setPlacingOrder(true);

      await runTransaction(db, async (transaction) => {

        // 1️⃣ Check availability
        for (let item of cartItems) {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) {
            throw new Error("Product not found");
          }

          if (!productSnap.data().isAvailable) {
            throw new Error("Product already sold");
          }
        }

        // 2️⃣ Lock products
        for (let item of cartItems) {
          const productRef = doc(db, "products", item.productId);
          transaction.update(productRef, {
            isAvailable: false,
          });
        }

        // 3️⃣ Create order
        const orderRef = doc(collection(db, "orders"));
        transaction.set(orderRef, {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          address: selectedAddress,
          items: cartItems,
          totalAmount,
          status: "Payment verification pending",
          createdAt: serverTimestamp(),
        });

        // 4️⃣ Clear cart
        for (let item of cartItems) {
          const cartRef = doc(
            db,
            "users",
            currentUser.uid,
            "cart",
            item.id
          );
          transaction.delete(cartRef);
        }

      });

      router.push("/order-confirmation");

    } catch (error) {
      if (error.message === "Product already sold") {
        alert("Sorry, this product was just sold.");
      } else {
        alert("Something went wrong.");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  /* =============================
     GUARDS
  ============================== */

  if (loadingAuth) {
    return <div className="text-center py-20">Loading...</div>;
  }

  if (!currentUser) return null;

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        Cart is empty
        <br />
        <Link href="/" className="text-green-600">
          Go Shopping →
        </Link>
      </div>
    );
  }

  /* =============================
     UI
  ============================== */

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="bg-white p-4 rounded-xl border">
        <h2 className="font-semibold mb-3">
          Select Delivery Address
        </h2>

        {addresses.length === 0 ? (
          <Link
            href="/profile/address"
            className="text-green-600 font-semibold"
          >
            + Add New Address
          </Link>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => setSelectedAddress(addr)}
              className={`border rounded-lg p-3 mb-2 cursor-pointer ${
                selectedAddress?.id === addr.id
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <p>{addr.address}</p>
            </div>
          ))
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border">
        <h2 className="font-semibold mb-4">
          Order Summary
        </h2>

        {cartItems.map((item) => (
          <div key={item.id} className="flex gap-4 mb-4">
            <img
              src={item.imageUrl}
              className="w-20 h-20 object-contain border rounded"
            />
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-500">
                Size: {item.size}
              </p>
              <p className="font-semibold">
                ₹{item.price}
              </p>
            </div>
          </div>
        ))}

        <div className="flex justify-between font-bold text-lg mt-4">
          <span>Total</span>
          <span>₹{totalAmount}</span>
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={placingOrder}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold"
      >
        {placingOrder ? "Placing..." : "I have paid"}
      </button>

    </div>
  );
}
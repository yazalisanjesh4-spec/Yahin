"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [loading, setLoading] = useState(true);

  /* =========================
     AUTH + LOAD DATA
  ========================== */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      // Load Cart
      const cartSnap = await getDocs(
        collection(db, "users", currentUser.uid, "cart")
      );

      const cart = cartSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCartItems(cart);

      // Load Addresses
      const addrSnap = await getDocs(
        collection(db, "users", currentUser.uid, "addresses")
      );

      const addrList = addrSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAddresses(addrList);

      if (addrList.length > 0) {
        setSelectedAddress(addrList[0]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.price),
    0
  );

  /* =========================
     PLACE ORDER (ATOMIC + PROFILE SAFE)
  ========================== */
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert("Please select address");
      return;
    }

    if (!user) return;

    try {
      setPlacingOrder(true);

      await runTransaction(db, async (transaction) => {

        // 🔹 1️⃣ Fetch user profile
        const userRef = doc(db, "users", user.uid);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
          throw new Error("USER_DATA_MISSING");
        }

        const userData = userSnap.data();

        if (!userData.name || !userData.phone) {
          throw new Error("PROFILE_INCOMPLETE");
        }

        // 🔹 2️⃣ Validate and lock products
        for (let item of cartItems) {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) {
            throw new Error("PRODUCT_DELETED");
          }

          if (!productSnap.data().isAvailable) {
            throw new Error("PRODUCT_SOLD");
          }

          transaction.update(productRef, {
            isAvailable: false,
          });
        }

        // 🔹 3️⃣ Create Order
        const orderRef = doc(collection(db, "orders"));

        transaction.set(orderRef, {
          userId: user.uid,
          userEmail: user.email,
          userName: userData.name,
          phone: userData.phone,
          address: selectedAddress.address,
          items: cartItems,
          totalAmount,
          status: "Payment verification pending",
          createdAt: serverTimestamp(),
        });
      });

      // 🔹 4️⃣ Clear Cart
      for (let item of cartItems) {
        await deleteDoc(
          doc(db, "users", user.uid, "cart", item.id)
        );
      }

      router.push("/order-confirmation");

    } catch (error) {

      if (error.message === "PROFILE_INCOMPLETE") {
        alert("Please complete your profile before ordering.");
        router.push("/profile/edit");
      }
      else if (error.message === "PRODUCT_DELETED") {
        alert("One product was removed from store.");
      }
      else if (error.message === "PRODUCT_SOLD") {
        alert("Sorry, product already sold.");
      }
      else {
        console.error(error);
        alert("Something went wrong.");
      }

    } finally {
      setPlacingOrder(false);
    }
  };

  /* =========================
     UI
  ========================== */

  if (loading)
    return <div className="text-center py-20">Loading...</div>;

  if (cartItems.length === 0)
    return (
      <div className="text-center py-20">
        Cart is empty
        <br />
        <Link href="/" className="text-green-600">
          Go shopping →
        </Link>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ADDRESS */}
      <div className="bg-white p-4 rounded-xl border">
        <h2 className="font-semibold mb-3">Select Address</h2>

        {addresses.map((addr) => (
          <div
            key={addr.id}
            onClick={() => setSelectedAddress(addr)}
            className={`border p-3 mb-2 rounded cursor-pointer ${
              selectedAddress?.id === addr.id
                ? "border-green-600 bg-green-50"
                : "border-gray-200"
            }`}
          >
            {addr.address}
          </div>
        ))}
      </div>

      {/* ORDER SUMMARY */}
      <div className="bg-white p-4 rounded-xl border">
        <h2 className="font-semibold mb-4">Order Summary</h2>

        {cartItems.map((item) => (
          <div key={item.id} className="flex gap-4 mb-4">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-16 h-16 object-contain border rounded"
            />
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm">₹{item.price}</p>
            </div>
          </div>
        ))}

        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>₹{totalAmount}</span>
        </div>
      </div>

      {/* PAYMENT */}
      <div className="bg-white p-4 rounded-xl border text-center">
        <img
          src="/upi-qr.png"
          className="w-48 h-48 mx-auto border rounded mb-4"
          alt="UPI QR"
        />

        <button
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          className="w-full bg-green-600 text-white py-3 rounded-xl"
        >
          {placingOrder ? "Placing Order..." : "I have paid"}
        </button>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { cartItems, removeFromCart } = useCart();

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price,
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mt-2">
          Add items to your cart to continue
        </p>

        <Link
          href="/"
          className="inline-block mt-6 text-green-400 font-semibold"
        >
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Your Cart
      </h1>

      {/* Cart Items */}
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center bg-white p-4 rounded-lg border"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-20 h-20 object-cover rounded"
            />

            <div className="ml-4 flex-1">
              <h3 className="font-semibold">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500">
                Size: {item.size}
              </p>
              <p className="text-sm text-gray-500">
                {item.shopName}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold">
                ₹{item.price}
              </p>

              <button
                onClick={() => removeFromCart(item.id)}
                className="text-sm text-red-500 mt-2"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="mt-8 bg-white p-4 rounded-lg border">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>₹{totalAmount}</span>
        </div>

        <p className="text-sm text-gray-500 mt-1">
          Includes product & delivery charges
        </p>

       <button
  onClick={() => {
    const user = localStorage.getItem("yahin_user");
    if (!user) {
      window.location.href = "/login";
    } else {
      window.location.href = "/checkout";
    }
  }}
  className="mt-4 w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
>
  Proceed to Checkout
</button>
      </div>
    </div>
  );
}
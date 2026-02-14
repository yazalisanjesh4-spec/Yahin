"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [addedMessage, setAddedMessage] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const snap = await getDoc(doc(db, "products", id));
      if (snap.exists()) {
        setProduct({ id: snap.id, ...snap.data() });
      }
    };

    fetchProduct();
  }, [id]);

  if (!product) {
    return (
      <p className="text-center mt-10 text-gray-500">
        Loading product...
      </p>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);

    // Show success message
    setAddedMessage(true);

    // Hide after 2 seconds
    setTimeout(() => {
      setAddedMessage(false);
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* PRODUCT IMAGE (FULL IMAGE FIXED) */}
      <div className="bg-white rounded-lg p-4">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full max-h-96 object-contain rounded"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/300x300?text=No+Image";
          }}
        />
      </div>

      {/* PRODUCT DETAILS */}
      <div className="mt-6 space-y-3">
        <p className="text-lg font-semibold">
          <span className="text-gray-600">Product Name: </span>
          {product.title}
        </p>

        <p className="text-md">
          <span className="text-gray-600">Available Size: </span>
          {product.size}
        </p>

        <p className="text-xl font-bold text-green-600">
          <span className="text-gray-600 text-base font-normal">
            Price:{" "}
          </span>
          ₹{product.price}
        </p>
      </div>

      {/* ADD TO CART BUTTON */}
      <button
        onClick={handleAddToCart}
        className="mt-6 w-full bg-red-400 text-white py-3 rounded-full font-semibold hover:bg-red-500 transition"
      >
        Add to Cart
      </button>

      {/* SUCCESS MESSAGE */}
      {addedMessage && (
        <div className="mt-4 text-center text-green-600 font-medium">
          Product added to cart successfully ✔
        </div>
      )}
    </div>
  );
}
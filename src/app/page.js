"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔒 Show only available products
    const q = query(
      collection(db, "products"),
      where("isAvailable", "==", true)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <p className="text-center text-gray-500 mt-10">
        Loading products…
      </p>
    );
  }

  return (
    <div>
      {products.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          No products available right now
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="bg-white  rounded-lg p-3 hover:shadow-sm"
          >
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-40 object-cover rounded"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/300x300?text=No+Image";
              }}
            />

            <h3 className="font-medium text-sm mt-2">
              {product.title}
            </h3>

            <p className="text-xs text-gray-500">
              Size: {product.size}
            </p>

            <p className="font-bold text-sm mt-1">
              ₹{product.price}
            </p>

            <p className="text-sm text-gray-800">
               shopname : {product.shopName}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
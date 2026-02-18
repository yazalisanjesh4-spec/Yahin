"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGuard from "@/components/AdminGuard";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [adding, setAdding] = useState(false);

  const [form, setForm] = useState({
    title: "",
    size: "",
    price: "",
    shopName: "",
    imageUrl: "",
  });

  /* =========================
     LOAD PRODUCTS
  ========================== */
  useEffect(() => {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsub();
  }, []);

  /* =========================
     ADD PRODUCT
  ========================== */
  const addProduct = async () => {
    if (!form.title || !form.price || !form.imageUrl) {
      alert("Title, Price and Image are required");
      return;
    }

    try {
      setAdding(true);

      await addDoc(collection(db, "products"), {
        title: form.title,
        size: form.size,
        price: Number(form.price),
        shopName: form.shopName,
        imageUrl: form.imageUrl,
        isAvailable: true,
        createdAt: serverTimestamp(),
      });

      setForm({
        title: "",
        size: "",
        price: "",
        shopName: "",
        imageUrl: "",
      });

    } catch (error) {
      console.error(error);
      alert("Error adding product");
    } finally {
      setAdding(false);
    }
  };

  const deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
  };

  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto px-4">

        <h1 className="text-2xl font-bold mb-6">
          Manage Products
        </h1>

        {/* =========================
           ADD PRODUCT CARD
        ========================== */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-10">
          <h2 className="font-semibold mb-5 text-lg">
            Add New Product
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              placeholder="Title"
              className="border px-4 py-2 rounded-xl"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              placeholder="Size"
              className="border px-4 py-2 rounded-xl"
              value={form.size}
              onChange={(e) =>
                setForm({ ...form, size: e.target.value })
              }
            />

            <input
              placeholder="Price"
              type="number"
              className="border px-4 py-2 rounded-xl"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
            />

            <input
              placeholder="Shop Name"
              className="border px-4 py-2 rounded-xl"
              value={form.shopName}
              onChange={(e) =>
                setForm({ ...form, shopName: e.target.value })
              }
            />

            <input
              placeholder="Image URL"
              className="border px-4 py-2 rounded-xl md:col-span-2"
              value={form.imageUrl}
              onChange={(e) =>
                setForm({ ...form, imageUrl: e.target.value })
              }
            />
          </div>

          {/* 🔥 LIVE IMAGE PREVIEW */}
          {form.imageUrl && (
            <div className="mt-6 flex justify-center">
              <img
                src={form.imageUrl}
                alt="Preview"
                className="w-40 h-40 object-contain border rounded-xl"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/150?text=Invalid+Image";
                }}
              />
            </div>
          )}

          <button
            onClick={addProduct}
            disabled={adding}
            className="mt-6 bg-green-600 text-white px-6 py-2 rounded-xl disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add Product"}
          </button>
        </div>

        {/* =========================
           PRODUCT LIST
        ========================== */}
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex justify-between items-center bg-white rounded-xl shadow-sm border p-4"
            >
              <div className="flex items-center">
                <img
                  src={product.imageUrl}
                  className="w-16 h-16 rounded-lg object-cover border"
                  alt={product.title}
                />
                <div className="ml-4">
                  <p className="font-semibold">
                    {product.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    ₹{product.price} — {product.shopName}
                  </p>
                  {!product.isAvailable && (
                    <span className="text-xs text-red-500">
                      Sold
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteProduct(product.id)}
                className="text-red-500 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

      </div>
    </AdminGuard>
  );
}
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGuard from "@/components/AdminGuard";

const STATUS_OPTIONS = [
  "Payment verification pending",
  "Confirmed with shop",
  "Out for delivery",
  "Delivered",
  "Cancelled",
];

function formatDate(timestamp) {
  if (!timestamp) return "Unknown";
  try {
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString("en-IN");
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString("en-IN");
    }
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState(
    "Payment verification pending"
  );

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    });

    return () => unsub();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) => order.status === activeTab
    );
  }, [orders, activeTab]);

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto px-4">

        <h1 className="text-2xl font-bold mb-6">
          Manage Orders
        </h1>

        {/* 🔹 STATUS TABS */}
        <div className="flex flex-wrap gap-3 mb-6">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition
                ${
                  activeTab === status
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <p className="text-gray-500">
            No orders in this category
          </p>
        )}

        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const safeAddress =
              typeof order.address === "string"
                ? order.address
                : order.address?.address || "No address";

            return (
              <div
                key={order.id}
                className="bg-white border rounded-xl p-5 shadow-sm"
              >
                {/* HEADER */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order ID: {order.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Placed at: {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <select
                    className="border rounded px-3 py-1 text-sm"
                    value={order.status}
                    onChange={async (e) => {
                      await updateDoc(
                        doc(db, "orders", order.id),
                        { status: e.target.value }
                      );
                    }}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* USER INFO */}
                <div className="mb-4 text-sm space-y-1">
                  <p>
                    <strong>Name:</strong>{" "}
                    {order.userName || "—"}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {order.userEmail || "—"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {order.phone || order.phoneNumber || "—"}
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                    {safeAddress}
                  </p>
                </div>

                {/* ITEMS */}
                <div className="space-y-3">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center text-sm"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded border"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/80x80?text=No+Image";
                        }}
                      />

                      <div className="ml-4">
                        <p className="font-medium">
                          {item.title}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Size {item.size}
                        </p>
                      </div>

                      <span className="ml-auto font-semibold">
                        ₹{item.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* TOTAL */}
                <div className="flex justify-between font-semibold mt-5 border-t pt-3">
                  <span>Total</span>
                  <span>₹{order.totalAmount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminGuard>
  );
}
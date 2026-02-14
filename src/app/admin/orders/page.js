"use client";

import { useEffect, useState } from "react";
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

  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Manage Orders
        </h1>

        {orders.length === 0 && (
          <p className="text-gray-500">No orders yet</p>
        )}

        <div className="space-y-6">
          {orders.map((order, index) => {
            const safeAddress =
              typeof order.address === "string"
                ? order.address
                : order.address?.address || "No address";

            return (
              <div
                key={order.id}
                className="bg-white border rounded-lg p-4"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order ID: {order.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Placed at: {formatDate(order.createdAt)}
                    </p>

                    {index === 0 && (
                      <span className="inline-block mt-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        NEW
                      </span>
                    )}
                  </div>

                  <select
                    className="border rounded px-2 py-1 text-sm"
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

                {/* User Info */}
                <div className="mb-3 text-sm space-y-1">
                  <p>
                    <strong>User:</strong>{" "}
                    {order.userName || "—"}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {order.userEmail || "—"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {order.phoneNumber || "—"}
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                    {safeAddress}
                  </p>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center text-sm"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-10 h-10 object-cover rounded"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/80x80?text=No+Image";
                        }}
                      />

                      <span className="ml-3">
                        {item.title} (Size {item.size})
                      </span>

                      <span className="ml-auto font-semibold">
                        ₹{item.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between font-semibold mt-4">
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
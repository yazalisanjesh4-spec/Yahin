"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const handleSave = async () => {
    if (!phone || !address) {
      alert("Phone number and address are required");
      return;
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        name,
        phone,
        address,
        email: user.email,
      },
      { merge: true }
    );

    alert("Profile updated");
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <p className="text-center mt-20">
        Loading profile…
      </p>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        My Profile
      </h1>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          className="w-full border rounded-full px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          value={user.email}
          disabled
          className="w-full border rounded-full px-3 py-2 bg-gray-100"
        />

        <input
          type="tel"
          placeholder="Phone number"
          className="w-full border rounded-full px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <textarea
          placeholder="Delivery address"
          className="w-full border rounded px-3 py-2"
          rows={4}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button
          onClick={handleSave}
          className="w-full bg-green-400 text-white py-2 rounded-full font-semibold"
        >
          Save Profile
        </button>

        <button
          onClick={handleLogout}
          className="w-full border bg-red-500 border-red-500 text-white py-2 rounded-full"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
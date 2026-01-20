"use client";

import React, { useState } from "react";
import { getSupabaseClient } from "@/lib/supaBaseClient";
import Modal from "react-modal";
import { PulseLoader } from "react-spinners";

Modal.setAppElement("body");

const Settings = () => {
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
const supabase = getSupabaseClient();
  // -----------------------
  // Logout
  // -----------------------
  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);

    window.location.href = "/"; // redirect after logout
  };

  // -----------------------
  // Delete Account
  // -----------------------
  const handleDelete = async () => {
    setLoading(true);

    // 1. Get user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 2. Delete profile row
    await supabase.from("profiles").delete().eq("id", user.id);

    // 3. Delete user auth account
    await supabase.auth.admin.deleteUser(user.id);

    setLoading(false);

    window.location.href = "/"; // redirect after deletion
  };

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold font-mono mb-6">Settings</h1>

      {/* LOGOUT BUTTON */}
      <div>
      <button
        onClick={() => setLogoutModal(true)}
        className=" mt-3 py-3 px-3 rounded-xl bg-blue-600 text-white font-bold font-mono shadow hover:shadow-lg transition cursor-pointer"
      >
        Logout
      </button>
</div>
      {/* DELETE ACCOUNT BUTTON */}
      <div>
      <button
        onClick={() => setDeleteModal(true)}
        className=" mt-3 py-3 px-3 rounded-xl bg-red-600 text-white font-bold font-mono shadow hover:shadow-lg transition cursor-pointer"
      >
        Delete Account
      </button>
</div>
      {/* LOGOUT MODAL */}
      <Modal
        isOpen={logoutModal}
        onRequestClose={() => setLogoutModal(false)}
        className="bg-white p-6 rounded-xl shadow-xl max-w-md mx-auto"
        overlayClassName="fixed inset-0 bg-black/40 flex items-center justify-center"
      >
        <h2 className="font-bold text-lg mb-4">Confirm Logout</h2>
        <p className="mb-4">Are you sure you want to log out?</p>

        <button
          onClick={handleLogout}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold flex justify-center cursor-pointer"
        >
          {loading ? <PulseLoader size={8} color="#0A3D62" /> : "Log Out"}
        </button>

        <button
          onClick={() => setLogoutModal(false)}
          className="w-full mt-3 bg-gray-300 text-black py-2 rounded-lg font-bold cursor-pointer"
        >
          Cancel
        </button>
      </Modal>

      {/* DELETE ACCOUNT MODAL */}
      <Modal
        isOpen={deleteModal}
        onRequestClose={() => setDeleteModal(false)}
        className="bg-white p-6 rounded-xl shadow-xl max-w-md mx-auto"
        overlayClassName="fixed inset-0 bg-black/40 flex items-center justify-center"
      >
        <h2 className="font-bold text-lg mb-4 text-red-600">Delete Account</h2>

        <p className="mb-4 text-sm text-gray-700">
          This action is permanent. Your account and all associated data will be deleted.
        </p>

        <button
          onClick={handleDelete}
          className="w-full bg-red-600 text-white py-2 rounded-lg font-bold flex justify-center cursor-pointer"
        >
          {loading ? <PulseLoader size={8} color="#0A3D62" /> : "Delete Account"}
        </button>

        <button
          onClick={() => setDeleteModal(false)}
          className="w-full mt-3 bg-gray-300 text-black py-2 rounded-lg font-bold cursor-pointer"
        >
          Cancel
        </button>
      </Modal>
    </div>
  );
};

export default Settings;

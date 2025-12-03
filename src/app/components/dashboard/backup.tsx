"use client";

import { useState } from "react";
import { useProfileStore } from "@/store/userProfile";
import { FaGlobe } from "react-icons/fa";
import { FaCopy } from "react-icons/fa";
import { IoMdCheckmark } from "react-icons/io";

export default function DashboardPage() {
  const { profile, users,setLink,setFeedback,link,feedback } = useProfileStore();

  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [snippet, setSnippet] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
const [copied, setCopied] = useState(false);

  async function createProject() {
    try {
      setLoading(true);
      setError("");
      setSnippet("");
      setMsg("");

      if (!domain.trim()) {
        setError("Please enter a valid domain.");
        return;
      }

      if (!users?.session?.access_token) {
        setError("User not authenticated.");
        return;
      }

      const res = await fetch("/api/create-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${users.session.access_token}`,
        },
        body: JSON.stringify({ domain }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      // success
      setFeedback(data?.message || "Project created successfully!");
setMsg(data?.message || "Project created successfully!");

setLink(data?.snippet || "");
setSnippet(data?.snippet || "");
    } catch (err) {
      setError("Failed to create project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-no-repeat bg-cover bg-bottom-left"
      style={{ backgroundImage: "url('/dashboardbg2.jpg')" }}
    >
      <div className="flex flex-col items-center justify-center gap-6 w-[90%] max-w-lg">

        <h2 className="text-white font-figtree text-[25px] font-bold">
          Paste your website URL
        </h2>

        {/* Input Box */}
        <div className="relative flex items-center pl-2 bg-gray-300 rounded-2xl h-12 w-full animated-border">
          <FaGlobe size={17} color="black" />
          <input
            type="text"
            className="outline-none bg-transparent px-2 text-black placeholder-gray-400 font-figtree font-semibold w-full"
            placeholder="Your Website URL..."
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>

        {/* Button */}
        <button
          onClick={createProject}
          disabled={loading}
          className="
            bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold 
            cursor-pointer transition-all duration-200
            transform hover:-translate-y-1 hover:bg-purple-700 
            disabled:opacity-50 disabled:hover:translate-y-0
          "
        >
          {loading ? "Creating..." : "Create Project"}
        </button>

        {/* Error Display */}
        {error && <p className="text-red-400 font-semibold">{error}</p>}

        {/* Success Message */}
        {feedback && <p className="text-green-400 font-semibold"> {feedback}</p>}

        {/* Snippet Display */}
      {/* Snippet Display */}
{link && (
  <div className="bg-black/50 text-green-300 p-4 rounded-xl w-full break-all font-mono text-sm flex ">
    <span className="flex-1">{link}</span>

    <button
      onClick={() => {
        navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-end justify-center cursor-pointer ml-2 transition-all duration-300"
    >
      {copied ? (
        <IoMdCheckmark />
      ) : (
        <FaCopy className="transition-opacity duration-300" />
      )}
    </button>
  </div>
)}

      </div>
      
    </main>
  );
}

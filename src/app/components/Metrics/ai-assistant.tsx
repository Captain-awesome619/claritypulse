import React, { useState } from "react";
import { PulseLoader } from "react-spinners";
import { FaArrowLeftLong } from "react-icons/fa6";
interface AssistantProps {
  formerdate: string;
  laterdate: string;
  browsercount: Record<string, number>;
  devicecount: Record<string, number>;
  uniqueVisitors: number;
  newuserscount: number;
  avgMetrics: {
    clicks: number;
    scrolls: number;
    mouseMoves: number;
    scrollDepth: number;
    sessionDurationSec: number;
  };
}

const Assistant: React.FC<AssistantProps> = ({
  formerdate,
  laterdate,
  uniqueVisitors,
  newuserscount,
  browsercount,
  devicecount,
  avgMetrics,
}) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInsight, setShowInsight] = useState(false);

  const handleGetInsight = async () => {
    setLoading(true);
    setError(null);

    const analyticsSnapshot = {
      timeframe: {
        from: formerdate,
        to: laterdate,
      },
      users: {
        total: uniqueVisitors,
        new: newuserscount,
        returning: uniqueVisitors - newuserscount,
      },
      devices: devicecount,
      browsers: browsercount,
      engagement: {
        clicks: avgMetrics.clicks,
        scrolls: avgMetrics.scrolls,
        avgScrollDepth: avgMetrics.scrollDepth,
        sessionDurationSec: avgMetrics.sessionDurationSec,
      },
    };

    try {
      const res = await fetch("/api/cohere-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analytics: analyticsSnapshot }),
      });

      if (!res.ok) throw new Error("Failed to fetch AI insight");

      const data = await res.json();
      const text =
        data.insight?.content?.[0]?.text ?? "No insight generated.";

      setInsight(text);
      setShowInsight(true);
    } catch {
      setError("Could not generate AI insight. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowInsight(false);
    setInsight(null);
    setError(null);
  };

  return (
    <div className="p-5 rounded-xl border bg-white shadow-sm flex flex-col gap-4">
      {!showInsight && (
        <>
          <h3 className="text-gray-700 font-figtree font-bold lg:text-[18px] text-[14px]">
            Get an In-depth AI-powered breakdown of your sites traffic from your assistant 
          </h3>
<div>
          <button
            onClick={handleGetInsight}
            disabled={loading}
            className="lg:px-4 lg:py-3 px-3 py-3 rounded-3xl 
              bg-linear-to-r from-blue-500 via-purple-500 to-violet-600
              shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-white cursor-pointer"
          >
            {loading ? (
              <PulseLoader size={20} color="white" />
            ) : (
              "View Breakdown"
            )}
          </button>
          </div>
        </>
      )}

      {showInsight && (
        <>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-purple-600 font-medium hover:underline w-fit cursor-pointer"
          >
           <FaArrowLeftLong /> Back
          </button>

          {insight && (
            <div className="p-4 bg-purple-50 rounded-lg text-gray-800 whitespace-pre-line font-semibold font-figtree">
              {insight}
            </div>
          )}
        </>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
};

export default Assistant;

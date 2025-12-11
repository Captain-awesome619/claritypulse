"use client";

import { useMemo, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  
} from "recharts";
import Settings from "./settings";
import { useProfileStore } from "@/store/userProfile";
import { getSupabaseClient } from "@/lib/supaBaseClient";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import logo from '../../../assests/transparentbg.png'
import Image from "next/image";
import { FaRegChartBar, FaUser, FaRobot } from "react-icons/fa"
import { IoSettings } from "react-icons/io5";
import { MdOutlineBarChart } from "react-icons/md";
import Table from "./table";
import { useRef } from "react";
import { TbBulbFilled } from "react-icons/tb";
import Modal from 'react-modal';
import Profile from "./profile";
type Events = {
  userId: string;
  isReturningUser: any;
  type: string;
  timestamp: string;
  sessionId: string;
  userAgent?: string;
  payload?: { scrollDepth?: number; eventType?: string };
};

function parseBrowser(userAgent?: string) {
  if (!userAgent) return "Unknown";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("OPR")) {
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    return match ? `Chrome ${match[1]}` : "Chrome";
  }
  if (userAgent.includes("Firefox")) {
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    return match ? `Firefox ${match[1]}` : "Firefox";
  }
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    const match = userAgent.match(/Version\/([\d.]+)/);
    return match ? `Safari ${match[1]}` : "Safari";
  }
  if (userAgent.includes("Edg")) {
    const match = userAgent.match(/Edg\/([\d.]+)/);
    return match ? `Edge ${match[1]}` : "Edge";
  }
  if (userAgent.includes("OPR")) {
    const match = userAgent.match(/OPR\/([\d.]+)/);
    return match ? `Opera ${match[1]}` : "Opera";
  }
  return "Unknown";
}

export default function AnalyticsDashboard() {

 const [domtoimage, setDomToImage] = useState<any>(null);
const [showNotice, setShowNotice] = useState(false);
const supabase = getSupabaseClient();
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotice(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    import("dom-to-image-more").then((mod) => setDomToImage(mod));
  }, []);

  const link = useProfileStore((state) => state.link); // projectId
  const [events, setEvents] = useState<Events[]>([]);
 const [step, setStep] = useState(1);
  const [activePage, setActivePage] = useState("Activity");
 const [open, setOpen] = useState(false);
const [showSessionLimit, setShowSessionLimit] = useState(false);
const [isClearModalOpen, setIsClearModalOpen] = useState(false);
const [isClearing, setIsClearing] = useState(false);
const [dat, setDat] =useState<any>(null)
const [newUsersCount, setNewUsersCount] = useState(0);
const [stepDirection, setStepDirection] = useState<any>(); 

 useEffect(() => {
  const fetchEvents = async () => {
    if (!link) return;

 const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log("Error fetching user:", userError);
      return;
    }

// Get the project linked to the user
const { data: project, error: projectError } = await supabase
  .from("projects")
  .select("*")
  .eq("user_id", user.id) // assuming your projects table has a user_id column
  .single();

if (projectError || !project) {
  console.log("Error fetching project:", projectError);
  return;
}
if (project) {
  setDat(project.project_name);
  
}

console.log("Fetched project data:", dat);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("project_id", link);

    if (error) {
      console.log("Error fetching events:", error);
      return;
    }
setStepDirection(data)
console.log("Fetched events data stepdirection:", stepDirection);

    const flattenedEvents: Events[] = data?.flatMap((item: any) =>
      item.events.map((e: any) => ({
        type: e.type,
        timestamp: e.timestamp,
        sessionId: e.sessionId ?? item.session_id,
        userAgent: e.userAgent,
        payload: e.payload,
      }))
    ) || [];

    setEvents(flattenedEvents);
console.log("Flattened events:", flattenedEvents)
    // NEW: check session count
    const uniqueIds = new Set(
      flattenedEvents.map((e) => e.sessionId)
    );

    if (uniqueIds.size >=10) {
      setShowSessionLimit(true);
    }
  };

  fetchEvents();
}, [link]);


useEffect(() => {
  if (dat) {
    console.log("dat state updated:", dat);
  }
}, [dat]);
useEffect(() => {
  if (stepDirection) {
    console.log("step state updatedd here", stepDirection);
  }
}, [stepDirection]);


  const allEvents = useMemo(() => events, [events]);



  const uniqueVisitorsSet = new Map<string, string>();
  allEvents.forEach((e) => {
    if (!uniqueVisitorsSet.has(e.sessionId)) {
      uniqueVisitorsSet.set(e.sessionId, parseBrowser(e.userAgent));
    }
  });
  const uniqueVisitors = uniqueVisitorsSet.size;


  const sidebarItems = [
  { name: "Activity", icon: <FaRegChartBar /> },
  { name: "Profile", icon: <FaUser /> },
  { name: "AI", icon: <FaRobot /> },
];



 const decrementStep = () => {
    setStep((prev) => prev - 1);
  };


const [timeRange, setTimeRange] = useState<"all" | "7" | "3" | "1">("all");
const [chartData, setChartData] = useState<{ date: string; users: number }[]>([]);

useEffect(() => {
  if (!allEvents.length) return;

  // Sort all events by timestamp ascending
  const sortedEvents = [...allEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Filter by timeRange
  const now = new Date();
  let filteredEvents = sortedEvents;
  if (timeRange !== "all") {
    const daysAgo = parseInt(timeRange);
    filteredEvents = sortedEvents.filter(
      (e) => new Date(e.timestamp) >= new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    );
  }

  // Track cumulative unique session IDs
  const seenSessions = new Set<string>();
 const dailyUsersMap = new Map<string, { count: number; sessions: string[] }>();
  filteredEvents.forEach((e) => {
    const dateStr = new Date(e.timestamp).toLocaleDateString();
    seenSessions.add(e.sessionId);
    const existing = dailyUsersMap.get(dateStr) || { count: 0, sessions: [] };
    dailyUsersMap.set(dateStr, {
      count: seenSessions.size,
      sessions: [...new Set([...existing.sessions, e.sessionId])], // add sessionId
    });
  });

  // Convert to array for Recharts
const data = Array.from(dailyUsersMap.entries())
  .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
  .map(([date, { count, sessions }]) => ({
    date,
    users: count,
    sessions, // include session IDs
  }));

  setChartData(data);
}, [allEvents, timeRange]);






const chartRef = useRef<HTMLDivElement>(null);

const handleExportPNG = async () => {
  if (!chartRef.current) return;

  const png = await domtoimage.toPng(chartRef.current);
  const link = document.createElement("a");
  link.href = png;
  link.download = "visitor-trend.png";
  link.click();
};

const clearEventData = async () => {
  if (!link) return;

  setIsClearing(true);

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("project_id", link);

  setIsClearing(false);

  if (error) {
    console.log("Error clearing events:", error);
    return;
  }

  // Wipe UI
  setEvents([]);
  setShowSessionLimit(false);
  setIsClearModalOpen(false);
};
 
useEffect(() => {
  if (!Array.isArray(stepDirection)) return;

  // Define the shape of a row
  type EventRow = {
    id: string;
    project_id: string;
    user_id: string;
    session_id: string;
    events: any[];
    is_returning_user: boolean;
    created_at: string;
  };

  const rows = stepDirection as EventRow[];

  // Group rows by session_id
  const grouped: Record<string, EventRow[]> = rows.reduce((acc, row) => {
    if (!acc[row.session_id]) acc[row.session_id] = [];
    acc[row.session_id].push(row);
    return acc;
  }, {} as Record<string, EventRow[]>);

  // Count sessions where the FIRST row has is_returning_user = false
  const newSessionCount = Object.values(grouped).filter((sessionRows) => {
    return sessionRows[0].is_returning_user === false;
  }).length;

  console.log("New users (unique sessions):", newSessionCount);
  setNewUsersCount(newSessionCount);
}, [stepDirection]);



  return (
    <div className="flex h-screen overflow-hidden bg-gray-200">

 <div
        className={`
          fixed top-0 left-1/2 transform -translate-x-1/2 
          w-full max-w-xl 
          bg-purple-700 text-white rounded-b-3xl shadow-lg
          px-6 py-4 flex items-start justify-between gap-4
          transition-all duration-500 ease-in-out
          ${showNotice ? "translate-y-0 opacity-100" : "-translate-y-32 opacity-0"}
          z-50
        `}
      >
        <div className="flex items-center gap-2">
         
          <div>
            <div className="flex items center gap-1">
               <TbBulbFilled className="text-yellow-400 w-6 h-6" />
            <h3 className="font-bold text-lg">Important Notice!</h3>
            </div>
            <p className="text-sm">
              The Maximum number of sessions that can be recorded per time for now is <strong>10</strong>. Please clear user sessions when the limit is reached to receive fresh analytics.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNotice(false)}
          className="text-white hover:text-gray-300 transition"
        >
          <IoClose size={24} className="cursor-pointer" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-linear-to-b from-blue-600 via-purple-600 to-violet-700 text-white w-64 p-4 flex flex-col transform transition-transform duration-300 z-50
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex items-start justify-start">

<Image 
src={logo}
width={80}
height={80}
alt="logo"
/>
        </div>

      <nav className="flex-1 space-y-6 mt-6">
  {sidebarItems.map((item) => (
    <div
      key={item.name}
      onClick={() => setActivePage(item.name)}
      className={`cursor-pointer py-2 px-3 rounded-xl font-medium font-figtree transition-all
        ${activePage === item.name
          ? "bg-linear-to-r from-blue-500 via-purple-500 to-violet-600 shadow-md"
          : "hover:bg-blue-500/40"}`}
    >
      <div className="flex items-center justify-between gap-2">
          <span>{item.name}</span>
        <span>{item.icon}</span>
      
      </div>
    </div>
  ))}
</nav>

        <div className="mt-auto border-t border-blue-400 pt-4">
          <div
            onClick={() => setActivePage("Settings")}
            className={`cursor-pointer py-2 px-3 rounded-xl font-medium transition-all items-center justify-between flex
              ${activePage === "Settings"
                ? "bg-linear-to-r from-blue-500 via-purple-500 to-violet-600 shadow-md"
                : "hover:bg-blue-500/40"}`}
          >
            Settings
            <IoSettings />
          </div>
        </div>
      </div>

      <div className="md:hidden fixed top-0 left-0 w-full bg-white shadow-lg p-4 z-40 flex items-center justify-between ">
        <GiHamburgerMenu
          size={28}
          onClick={() => setOpen(true)}
          className="cursor-pointertext-black"
        />
       
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        ></div>
      )}

      <div className="flex-1 ml-0 md:ml-64 lg:mt-[5%] h-screen overflow-y-auto  p-6 mt-14">

        {activePage === "Activity" && (
        <>
      {step === 1 && (
  <div className="overflow-y-auto mb-20">
    <div
      className="
        bg-white/80 backdrop-blur
        rounded-3xl
        shadow-[0_0_25px_rgba(0,0,0,0.15)]
        p-8 w-full max-w-xl grid gap-5
        overflow-y-auto
      "
    >
      <div className="flex lg:flex-row flex-col lg:items-center lg:justify-between">
      <h2 className="text-2xl font-bold text-gray-700 mb-4 ">
        {dat} Report
      </h2>
      {showSessionLimit && (
  <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 mb-4 rounded-xl">
    <p className="text-sm font-semibold">
      Session limit reached (10). Please clear your session record to receive new data.
    </p>

    <button
      onClick={() => setIsClearModalOpen(true)}
      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
    >
      Clear
    </button>
  </div>
)}

</div>
      <div className="space-y-5">
        {/* Visitors */}
        <p className="text-lg font-semibold text-gray-700 font-figtree">
          👥 Total number of visits from{" "}
          <span className="text-blue-600 font-bold">
            {allEvents.length > 0
              ? new Date(allEvents[0].timestamp).toLocaleDateString()
              : "No visitors yet"}{" "}
            to{" "}
            {allEvents.length > 0
              ? new Date(
                  allEvents[allEvents.length - 1].timestamp
                ).toLocaleDateString()
              : "No visitors yet"}
          </span>{" "}
          is{" "}
          <span className=" text-[20px] lg:text-2xl text-purple-600 font-bold">
            {uniqueVisitors}
          </span>
          <br></br><span className=" text-[12px] flex items-center justify-center font-bold text-blue-600 font-figtree">(latter date is the date the earliest visitor in this interval visited the site)</span>
        </p>

<p className="text-lg font-semibold text-gray-700 font-figtree">
  🆕 Number of new users in this timeframe:{" "}
  <span className="text-green-600 font-bold text-[20px] lg:text-2xl">
    {newUsersCount}
  </span>
</p>

        
        <button
          className="px-3 py-2 rounded-3xl 
          bg-linear-to-r from-blue-500 via-purple-500 to-violet-600
          shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
          onClick={() => setStep((prev) => prev + 1)}
        >
          <div>
            <MdOutlineBarChart size={15} color="white" />
          </div>
          <h4 className=" text-white font-mono font-bold">View Table</h4>
        </button>
      </div>
    </div>

    {/* ================== CHART SECTION ================== */}
   <div className="mt-8 bg-white/80 backdrop-blur rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.15)] p-6 w-full max-w-2xl ">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-xl font-bold text-gray-900">Visitor Trend</h3>
    <div className =" flex items-center gap-2">
    <select
      className="bg-purple-600 text-white  bg rounded-xl px-3  py-1 cursor-pointer"
      value={timeRange}
      onChange={(e) => setTimeRange(e.target.value as any)}
    >
      <option value="all" className="cursor-pointer ">From First User</option>
      <option value="7" className="cursor-pointer">Last 7 Days</option>
      <option value="3" className="cursor-pointer">Last 3 Days</option>
      <option value="1" className="cursor-pointer">Last 1 Day</option>
    </select>
     <button
          onClick={handleExportPNG}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 transition cursor-pointer"
        >
          Export
        </button>
        </div>
  </div>
<div  ref={chartRef} className="">
  <ResponsiveContainer width="100%" height={300} >
    <LineChart data={chartData}>
      <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
      <XAxis dataKey="date" />
      <YAxis allowDecimals={false} />
    <Tooltip
  content={({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 rounded shadow border border-gray-200 text-sm">
          <p className="font-bold">{label}</p>
          <p className="text-gray-600 break-all">
            Session IDs: {data.sessions.join(", ")}
          </p>
        </div>
      );
    }
    return null;
  }}
/>

      <Line
        type="monotone"
        dataKey="users"
        stroke="purple"
        strokeWidth={3}
        dot={{ r: 4 }}
        isAnimationActive={true}      // Enable animation
        animationDuration={800}       // Animation duration in ms
      />
    </LineChart>
  </ResponsiveContainer>
  </div>
</div>

  </div>
)}
 {
  step == 2 ?
  <div>
    <Table events={events} decrement={decrementStep} stepdirection={stepDirection}/>
     </div>
  : ""
 }




</>
        )}




        {activePage === "Profile" && (
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.15)] p-8 w-full max-w-xl grid gap-5">
           <Profile />
          </div>
        )}

        {activePage === "AI" && (
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.15)] p-8 w-full max-w-xl grid gap-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Fature coming soon</h2>
            <p className="text-lg text-gray-700">The AI assistant will be ready soon</p>
          </div>
        )}

        {activePage === "Settings" && (
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.15)] p-8 w-full max-w-xl grid gap-5">
          <Settings />
          </div>
        )}

      </div>
      <Modal
  isOpen={isClearModalOpen}
  onRequestClose={() => setIsClearModalOpen(false)}
 style={{
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      padding: "30px",
      borderRadius: "16px",
      background: "white",
      width: "350px",
      textAlign: "center",
    },
    overlay: {
      backgroundColor: "rgba(0,0,0,0.6)",
      zIndex: 1000,
    },
  }}
  ariaHideApp={false}
>
  <h2 className="text-xl font-bold text-gray-800 mb-3">Clear Event Data?</h2>
  <p className="text-gray-600 mb-6">
    Clearing your event data will allow you to receive fresh analytics.
  </p>

  <div className="flex justify-end gap-3">
    <button
      onClick={() => setIsClearModalOpen(false)}
      className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 cursor-pointer"
    >
      Cancel
    </button>

    <button
      onClick={clearEventData}
      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
    >
      {isClearing ? "Clearing..." : "Clear Data"}
    </button>
  </div>
</Modal>
    </div>

  );
}

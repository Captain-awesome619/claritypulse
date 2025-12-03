"use client";

import { useMemo, useEffect, useState } from "react";
import {
  Card,
  Title,
  Text,
  Grid,
  Flex,
  Metric,
} from "@tremor/react";
import {
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  MousePointerClick,
  ScrollText,
  Timer,
  Users,
} from "lucide-react";
import { useProfileStore } from "@/store/userProfile";
import { supabase } from "@/lib/supaBaseClient";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import logo from '../../../assests/transparentbg.png'
import Image from "next/image";
import { FaRegChartBar, FaUser, FaRobot } from "react-icons/fa"
import { IoSettings } from "react-icons/io5";
import { MdOutlineBarChart } from "react-icons/md";
import Table from "./table";
import { useRef } from "react";
import { useGenerateImage } from "recharts-to-png"
import domtoimage from "dom-to-image-more";


type Events = {
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

  // Dynamically import on client only
  useEffect(() => {
    import("dom-to-image-more").then((mod) => setDomToImage(mod));
  }, []);

  const link = useProfileStore((state) => state.link); // projectId
  const [events, setEvents] = useState<Events[]>([]);
 const [step, setStep] = useState(1);
  const [activePage, setActivePage] = useState("Activity");
 const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!link) return;

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("project_id", link);

      if (error) {
        console.log("Error fetching events:", error);
        return;
      }
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
    };
    fetchEvents();
  }, [link]);

  const allEvents = useMemo(() => events, [events]);

  const scrollData = allEvents
    .filter((e) => e.type === "scroll")
    .map((e) => ({
      depth: e.payload?.scrollDepth ?? 0,
      time: e.timestamp,
    }));


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

 const {  feedback } = useProfileStore();

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
  const dailyUsersMap = new Map<string, number>();

  filteredEvents.forEach((e) => {
    const dateStr = new Date(e.timestamp).toLocaleDateString();
    seenSessions.add(e.sessionId); // add to cumulative set
    dailyUsersMap.set(dateStr, seenSessions.size); // cumulative count up to this date
  });

  // Convert to array for Recharts
  const data = Array.from(dailyUsersMap.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, users]) => ({
      date,
      users,
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
  return (
    <div className="flex h-screen overflow-hidden bg-gray-200">
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
      <h2 className="text-2xl font-bold text-gray-900 mb-4 ">
        {feedback} Report
      </h2>

      <div className="space-y-5">
        {/* Visitors */}
        <p className="text-lg font-semibold text-gray-700 font-figtree">
          👥 Total number of visitors from{" "}
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
          <span className=" text-2xl text-purple-600 font-bold">
            {uniqueVisitors}
          </span>
        </p>

        {/* First Visitor Date */}
        <button
          className="px-4 py-3 rounded-3xl 
          bg-linear-to-r from-blue-500 via-purple-500 to-violet-600
          shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
          onClick={() => setStep((prev) => prev + 1)}
        >
          <div>
            <MdOutlineBarChart size={15} color="white" />
          </div>
          <h4 className=" text-white font-mono font-bold">View Activity</h4>
        </button>
      </div>
    </div>

    {/* ================== CHART SECTION ================== */}
   <div className="mt-8 bg-white/80 backdrop-blur rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.15)] p-6 w-full max-w-2xl ">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-xl font-bold text-gray-900">Visitor Trend</h3>
    <div className =" flex items-center gap-2">
    <select
      className="border border-gray-300 rounded-xl px-3 py-1 cursor-pointer"
      value={timeRange}
      onChange={(e) => setTimeRange(e.target.value as any)}
    >
      <option value="all" className="cursor-pointer">From First User</option>
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
      <Tooltip />
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
    <Table events={events} decrement={decrementStep}/>
     </div>
  : ""
 }




</>
        )}




        {activePage === "Profile" && (
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.15)] p-8 w-full max-w-xl grid gap-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Page</h2>
            <p className="text-lg text-gray-700">This is the Profile view content.</p>
          </div>
        )}

        {activePage === "AI" && (
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.15)] p-8 w-full max-w-xl grid gap-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Page</h2>
            <p className="text-lg text-gray-700">This is the AI view content.</p>
          </div>
        )}

        {activePage === "Settings" && (
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-[0_0_25px_rgba(0,0,0,0.15)] p-8 w-full max-w-xl grid gap-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings Page</h2>
            <p className="text-lg text-gray-700">This is the Settings view content.</p>
          </div>
        )}

      </div>
    </div>
  );
}

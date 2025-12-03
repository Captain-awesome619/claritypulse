'use client'
import React from 'react'
import { FaLongArrowAltLeft } from "react-icons/fa";
import { useMemo } from 'react';
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
import { FaMouse } from "react-icons/fa";
import { FaScroll } from "react-icons/fa6";
import { MdOutlineAssessment } from "react-icons/md";
import { useState } from 'react';
import { FaClock } from "react-icons/fa";
import { LuMousePointerClick } from "react-icons/lu";
import { color } from 'framer-motion';
import { FaMap } from "react-icons/fa";

type Events = {
  type: string;
  timestamp: string;
  sessionId: string;
  userAgent?: string;
  referrer?: string;
  payload?: { scrollDepth?: number; eventType?: string };
};

type TableProps = {
  dataa: Events[];
   Back :  () => void;
    session : string;
};



const Activity  = ({ dataa,Back,session }: TableProps) => {

const allEvents = useMemo(() => dataa, [dataa]);

  const scrollData = allEvents
    .filter((e) => e.type === "scroll")
    .map((e) => ({
      depth: e.payload?.scrollDepth ?? 0,
      time: e.timestamp,
    }));


const mouseCount = allEvents.filter((e) => e.type === "mouse").length;
const count = allEvents.filter((e) => e.type === "click").length;
  

  const sessionDuration = (() => {
    if (allEvents.length === 0) return 0;
    const first = new Date(allEvents[0].timestamp).getTime();
    const last = new Date(allEvents[allEvents.length - 1].timestamp).getTime();
    return Math.round((last - first) / 1000);
  })();

 const avgScroll =
    scrollData.reduce((acc, s) => acc + s.depth, 0) / (scrollData.length || 1);


   

 const sessionDurationSec = (() => {
    if (allEvents.length === 0) return 0;
    const first = new Date(allEvents[0].timestamp).getTime();
    const last = new Date(allEvents[allEvents.length - 1].timestamp).getTime();
    return Math.round((last - first) / 1000);
  })();

  // state to toggle between seconds and minutes
  const [inMinutes, setInMinutes] = useState(false);

  const displayDuration = inMinutes
    ? (sessionDurationSec / 60).toFixed(1)
    : sessionDurationSec;

  const unit = inMinutes ? "min" : "sec";

  
  return (
    <div className='grid gap-8'>
      <div className='flex items-center justify-between '>
    <div className='grid mb-6 ml-4 gap-4'>
<FaLongArrowAltLeft size={25} className=" cursor-pointer" onClick={Back}/>
   <h4 className='font-thin font-figtree text-[15px] text-purple-600 '>User {""}-  {session}</h4>
    </div>
        <button
              className="px-4 py-3 rounded-3xl 
              bg-linear-to-r from-blue-500 via-purple-500 to-violet-600
              shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            
            >
              <div>
                <FaMap size={15} color="white" />
              </div>
              <h4 className=" text-white font-mono font-bold">View Heatmap</h4>
            </button>
    </div>
      <div className='grid grid-cols-3 place-items-center gap-6'>
      {/* CARDS */}
      
       

        
          <div className="w-60 h-40 p-6 bg-white rounded-3xl shadow-lg grid grid-rows-[auto_1fr]">
  {/* Title + Icon */}
  <div className="flex items-center justify-between">
    <Text className="font-figtree font-semibold text-gray-700 text-sm">
      Mouse Interactions
    </Text>
    <FaMouse className="text-gray-600 text-lg" />
  </div>

  {/* Metric Number */}
  <div className="flex items-center justify-center">
    <Metric className="font-mono font-bold text-3xl text-purple-600">
      {mouseCount}
    </Metric>
  </div>
</div>


      
          <div className="w-60 h-40 p-6 bg-white rounded-3xl shadow-lg grid grid-rows-[auto_1fr]">
  {/* Title + Icon */}
  <div className="flex items-center justify-between">
    <Text className="font-figtree font-semibold text-gray-700 text-sm">
    Avg Scroll Depth(px)
    </Text>
    <FaScroll className="text-gray-600 text-lg" />
  </div>
  {/* Metric Number */}
  <div className="flex items-center justify-center">
    <Metric className="font-mono font-bold text-3xl text-purple-600">
      {mouseCount}{avgScroll.toFixed(1)}
    </Metric>
  </div>
</div>


          <div className="w-60 h-40 p-6 bg-white rounded-3xl shadow-lg grid grid-rows-[auto_1fr]">
  {/* Title + Icon */}
  <div className="flex items-center justify-between">
    <Text className="font-figtree font-semibold text-gray-700 text-sm">
    Number of Clicks
    </Text>
    <LuMousePointerClick className="text-gray-600 text-lg" />
  </div>

  {/* Metric Number */}
  <div className="flex items-center justify-center">
    <Metric className="font-mono font-bold text-3xl text-purple-600">
      {count}
    </Metric>
  </div>
</div>



        
         <div className="w-60 h-40 p-6 bg-white rounded-3xl shadow-lg grid grid-rows-[auto_1fr]">
  {/* Title + Icon */}
  <div className="flex items-center justify-between">
    <Text className="font-figtree font-semibold text-gray-700 text-sm">
     Session Length {""}in {unit}
    </Text>
    <FaClock className="text-gray-600 text-lg" />
  </div>

  {/* Metric Number */}
  <div className="flex items-center justify-center">
    <Metric className="font-mono font-bold text-3xl text-purple-600">
      {displayDuration} 
    </Metric>
  </div>
   <div className="flex justify-end ite">
        <button
          onClick={() => setInMinutes(!inMinutes)}
          className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition cursor-pointer"
        >
          {inMinutes ? "Show in seconds" : "Show in minutes"}
        </button>
      </div>
</div>

      
      </div>
      <div className='flex flex-col gap-4 mt-8'>
      <h3 className="font-figtree font-bold text-gray-700 text-[25px] ml-4 underline underline-offset-2 "> Charts</h3>
      <div  className='grid grid-cols-2 place-items-center gap-6' > 
 <Card>
          <Title className='text-sm font-figtree font-semibold text-gray-700'>Scroll Depth Over Time</Title>
          <Text className='text-sm font-figtree font-semibold text-gray-700'>Tracks how deep users scroll</Text>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={scrollData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" hide />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="depth"
                stroke="#8884d8"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <Title className='text-sm font-figtree font-semibold text-gray-700'>Mouse Events</Title>
          <Text className='text-sm font-figtree font-semibold text-gray-700'>Hover, click & movement frequency</Text>
          <ResponsiveContainer width="100%" height={280}>
          <BarChart
  data={[
    { name: "Mouse Events", value: mouseCount },
    { name: "Clicks", value: count },
  ]}
  barCategoryGap={20}
>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
    {[
      { name: "Mouse Events", value: mouseCount },
      { name: "Clicks", value: count },
    ].map((entry, index) => (
      <Cell
        key={`cell-${index}`}
        fill={entry.name === "Clicks" ? "#f472b6" : "#82ca9d"}
      />
    ))}
  </Bar>
</BarChart>

          </ResponsiveContainer>
        </Card>
     

      <Card>
        <Title className='text-sm font-figtree font-semibold text-gray-700'>Event Type Breakdown</Title>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: "Scroll", value: scrollData.length },
                { name: "Mouse", value: mouseCount },
                { name: "Clicks", value: count },
              ]}
              dataKey="value"
              outerRadius={110}
              label
            >
              <Cell fill="#6366f1" />
              <Cell fill="#14b8a6" />
              <Cell fill="#f472b6" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Card>

      </div>
      </div>
    </div>
  )
}

export default Activity
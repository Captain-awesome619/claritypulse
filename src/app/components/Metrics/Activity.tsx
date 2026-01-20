'use client'
import React from 'react'
import { FaLongArrowAltLeft } from "react-icons/fa";
import { useMemo } from 'react';

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

import { FaMouse } from "react-icons/fa";
import { FaScroll } from "react-icons/fa6";
import { MdOutlineAssessment } from "react-icons/md";
import { useState } from 'react';
import { FaClock } from "react-icons/fa";
import { LuMousePointerClick } from "react-icons/lu";
import { FaMap } from "react-icons/fa";
import Modal from 'react-modal';

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
const scroll = allEvents.filter((e) => e.type === "scroll").length;
  

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
 const [showModal, setShowModal] = useState(false);
  Modal.setAppElement("body");
  return (
    <div className='grid gap-8'>
      <div className='flex items-center justify-between '>
    <div className='grid mb-6 ml-4 gap-4'>
<FaLongArrowAltLeft size={25} className=" cursor-pointer" onClick={Back}/>
   <h4 className='font-figtree text-[15px] text-[#29C7AC] font-bold '>User {""}-  {session}</h4>
    </div>
        <button
              className="lg:px-4 lg:py-3 px-1 py-3 rounded-3xl 
              bg-[#0A3D62]
              shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center lg:gap-2 gap-2"
              onClick={() => setShowModal(true)}
            >
              <div>
                <FaMap color="white" className='text-[10px] lg:text-[14px]' />
              </div>
              <h4 className=" text-white font-mono font-bold text-[11px] lg:text-[11px] ">View Heatmap</h4>
            </button>
    </div>
      <div className='grid grid-cols-2 lg:grid-cols-3 place-items-center gap-6'>
     
      
       

        
          <div className="lg:w-60 gap-2 lg:gap-0  lg:h-40 lg:p-6 p-4 bg-white rounded-3xl shadow-lg grid grid-rows-[auto_1fr]">
  {/* Title + Icon */}
  <div className="flex items-center justify-between">
    <h3 className="font-figtree font-bold text-[#0A3D62] text-sm">
      Mouse Interactions
    </h3>
    <FaMouse className="text-gray-600 text-lg" />
  </div>

  {/* Metric Number */}
  <div className="flex items-center justify-center">
    <div className="font-mono font-bold text-[15px] lg:text-xl text-[#29C7AC]">
      {mouseCount}
    </div>
  </div>
</div>


      
          <div className="lg:w-60  gap-2 lg:gap-0 lg:h-40 lg:p-6 p-4 bg-white rounded-3xl shadow-lg grid grid-rows-[auto_1fr]">
  {/* Title + Icon */}
  <div className="flex items-center justify-between">
    <h3 className="font-figtree font-bold text-[#0A3D62] text-sm">
    Avg Scroll Depth(px)
    </h3>
    <FaScroll className="text-gray-600 text-lg" />
  </div>
  {/* Metric Number */}
  <div className="flex items-center justify-center">
    <div className="font-mono font-bold text-[15px] lg:text-xl text-[#29C7AC]">
      {mouseCount}{avgScroll.toFixed(1)}
    </div>
  </div>
</div>


          <div className="lg:w-60 gap-2 lg:gap-0 lg:h-40 lg:p-6 p-4 bg-white rounded-3xl shadow-lg grid grid-rows-[auto_1fr]">
  {/* Title + Icon */}
  <div className="flex items-center justify-between">
    <h3 className="font-figtree font-bold text-[#0A3D62] text-sm">
    Number of Clicks
    </h3>
    <LuMousePointerClick className="text-gray-600 text-lg" />
  </div>

  {/* Metric Number */}
  <div className="flex items-center justify-center">
    <div className="font-mono font-bold text-[15px] lg:text-xl text-[#29C7AC]">
      {count}
    </div>
  </div>
</div>



        
         <div className="lg:w-60  gap-2 lg:gap-0 lg:h-40 p-6 bg-white rounded-3xl shadow-lg grid grid-rows-[auto_1fr]">
  {/* Title + Icon */}
  <div className="flex items-center justify-between">
    <h3 className="font-figtree font-bold text-[#0A3D62] text-sm">
     Session Length {""}in {unit}
    </h3>
    <FaClock className="text-gray-600 text-lg" />
  </div>

  {/* Metric Number */}
  <div className="flex items-center justify-center">
    <div className="font-mono font-bold text-[15px] lg:text-xl text-[#29C7AC]">
      {displayDuration  } 
    </div>
  </div>
   <div className="flex justify-end items-end">
        <button
          onClick={() => setInMinutes(!inMinutes)}
          className="px-2 py-1 text-sm text-[#29C7AC] font-bold bg-[#0A3D62] rounded-full transition cursor-pointer"
        >
          {inMinutes ? "Show in sec" : "Show in min"}
        </button>
      </div>
</div>

      
      </div>
      <div className='flex flex-col gap-4 mt-8'>
      <h3 className="font-figtree font-bold text-gray-700 text-[25px] ml-4 underline underline-offset-2 "> Charts</h3>
      <div  className='grid lg:grid-cols-2 place-items-center gap-6' > 
 <div className='w-full'>
          <h3 className='text-sm font-figtree font-semibold text-gray-700'>Scroll Depth Over Time</h3>
          <h3 className='text-sm font-figtree font-semibold text-gray-700'>Tracks how deep users scroll</h3>
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
        </div>

        <div className='w-full'>
          <h3 className='text-sm font-figtree font-semibold text-gray-700'>Mouse Events</h3>
          <h3 className='text-sm font-figtree font-semibold text-gray-700'>Hover, click & movement frequency</h3>
          <ResponsiveContainer width="100%" height={280}>
          <BarChart
  data={[
    { name: "Mouse Events", value: mouseCount },
    { name: "Clicks", value: count },
    { name: "Scroll", value: scroll },
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
      { name: "Scroll", value: scroll },
    ].map((entry, index) => (
      <Cell
        key={`cell-${index}`}
     fill={
  entry.name === "Clicks"
    ? "#f472b6"      
    : entry.name === "Scroll"
    ? "#6366f1"          
    : "#82ca9d"    
}
      />
    ))}
  </Bar>
</BarChart>

          </ResponsiveContainer>
        </div>
     

      <div className='mb-12 w-full'>
        <h3 className='text-sm font-figtree font-semibold text-gray-700'>Event Type Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart className='pb-12'>
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
      </div>

      </div>
      </div>


         {/* React Modal */}
      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        contentLabel="Feature Coming Soon"
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
      >
        <h2 className="font-bold text-lg mb-4">😉Feature Coming Soon</h2>
        <p className="text-gray-600 mb-6">The heatmap feature will be available in a future update.</p>
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition cursor-pointer"
        >
          Close
        </button>
      </Modal>
    </div>
  )
}

export default Activity
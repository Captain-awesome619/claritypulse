"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { FiClock, FiUser, FiExternalLink } from "react-icons/fi";
import { MdCallToAction } from "react-icons/md";
import { CiGlobe } from "react-icons/ci";
import Activity from "./Activity";
import { IoBarChartOutline } from "react-icons/io5";
type Events = {
  type: string;
  timestamp: string;
  sessionId: string;
  userAgent?: string;
  referrer?: string;
  payload?: { scrollDepth?: number; eventType?: string };
};

type TableProps = {
  events: Events[];
  decrement :  () => void;
};

// Parse browser
function parseBrowser(userAgent?: string) {
  if (!userAgent) return "Unknown";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Edg")) return "Edge";
  return "Unknown";
}

const Table = ({ events,decrement }: TableProps) => {

  const [sorting, setSorting] = useState<SortingState>([]);

  const [activity , setActivity] = useState(1)
const [data , setData] = useState<Events[]>([])
const [session, setSession] = useState<string>("")

  const sessionRows = useMemo(() => {
    const map = new Map<string, Events>();
    events.forEach((e) => {
      if (!map.has(e.sessionId)) {
        map.set(e.sessionId, e);
      }
    });
    return Array.from(map.values());
  }, [events]);

  const columnHelper = createColumnHelper<any>();

  const columns = [
    columnHelper.display({
      id: "sn",
    header: () => <div className="font-figtree">S/N</div>,
      cell: (info) => (
        <span className="font-semibold font-figtree  text-gray-700">{info.row.index + 1}</span>
      ),
    }),

    columnHelper.accessor("sessionId", {
      header: () => (
        <div className="flex items-center gap-2 font-figtree">
          <FiUser className="text-blue-600" />
          Session ID
        </div>
      ),
          cell: (info) => (
    <div className="font-figtree text-gray-700">
      {info.getValue()}
    </div>
  ),
    }),

    columnHelper.accessor("timestamp", {
      header: ({ column }) => (
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => column.toggleSorting()}
        >
          <FiClock className="text-purple-600" />
          <span className="font-figtree">Date Visited</span>

          {/* Sorting icons */}
          {column.getIsSorted() === "asc" && <FaSortUp className="text-purple-600" />}
          {column.getIsSorted() === "desc" && <FaSortDown className="text-purple-600" />}
          {!column.getIsSorted() && <FaSort className="text-gray-400" />}
        </div>
      ),
      sortingFn: "datetime",
      cell: (info) => (
        <span className="text-gray-700 font-figtree">
          {new Date(info.getValue()).toLocaleString()}
        </span>
      ),
    }),

    columnHelper.accessor("referrer", {
     header: () => (
    <div className="font-figtree">
      Referrer
    </div>
  ),
    cell: (info) => (
  <div className="font-figtree">
    {info.getValue() || "None"}
  </div>
),
    }),

    columnHelper.accessor("userAgent", {
      header: () => (
        <div className="flex items-center gap-2 font-figtree">
            <CiGlobe size={15} className="text-purple-500 " />
          Browser
          
        </div>
      ),
      cell: (info) =>   <div className="font-figtree">
    {parseBrowser(info.getValue())}
  </div>
    }),

   columnHelper.display({
  id: "action",
  header: () => (
    <div className="flex items-center gap-2 font-figtree">
      <MdCallToAction className="text-blue-400" />
      Action
    </div>
  ),
  cell: (info) => {
    const sessionId = info.row.original.sessionId;

    return (
      <button
        onClick={() => handleViewMore(sessionId)}
        className="px-3 py-1 font-mono font-bold
        bg-linear-to-r from-blue-500 via-purple-500 to-violet-600
        shadow-md text-white rounded-lg hover:bg-blue-600 text-sm flex items-center gap-1 cursor-pointer"
      >
        View More <FiExternalLink />
      </button>
    );
  },
}),

  ];

  const table = useReactTable({
    data: sessionRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting, // ✅ properly typed
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });



const handleViewMore = (sessionId: string) => {
  const relatedEvents = events.filter(e => e.sessionId === sessionId);
  console.log("All events for session:", sessionId, relatedEvents);
setSession(sessionId);
  setData(relatedEvents);
   setActivity((prev) => prev + 1)
};

const Back = () => {
    setActivity((prev) => prev - 1);
  };

  return (
<>
{ activity == 1 ?
<>
<FaLongArrowAltLeft size={25} className="mb-6 ml-4 cursor-pointer" onClick={decrement}/>
    <div className="p-5 bg-white rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800 font-figtree">Session Activity</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700 border-b">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 text-left font-semibold uppercase tracking-wide text-sm"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50 transition">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 text-gray-800">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessionRows.length === 0 && (
        <p className="text-center py-6 text-gray-500">No activity yet.</p>
      )}
    </div>
</>
: ''}
{
  activity == 2 ?
<Activity dataa={data} Back={Back} session={session} />
  : ''
}
</>
  );
};

export default Table;

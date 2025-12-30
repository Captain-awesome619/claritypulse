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
import { FaLongArrowAltLeft, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { FiClock, FiUser, FiExternalLink } from "react-icons/fi";
import { MdCallToAction } from "react-icons/md";
import { CiGlobe } from "react-icons/ci";
import Activity from "./Activity";
import { FaLocationDot } from "react-icons/fa6";
type Events = {
  type: string;
  timestamp: string;
  sessionId: string;
  userAgent?: string;
  referrer?: string;
  payload?: {
    scrollDepth?: number;
    eventType?: string;
    location?: any;
    device?: {
      type?: "mobile" | "tablet" | "desktop";
      screen?: {
        width?: number;
        height?: number;
      };
      touch?: boolean;
    };
  };
};

type StepDirection = {
  session_id: any;
  sessionId: string;
  is_returning_user: boolean; // true = returning, false = new user
  location?: {
    city?: string;
    country_name?: string;
  };
};

type TableProps = {
  events: Events[];
  decrement: () => void;
  stepdirection?: StepDirection[];
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

function parseDeviceFromUA(userAgent?: string) {
  if (!userAgent) return "unknown";

  const ua = userAgent.toLowerCase();

  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)) {
    return "mobile";
  }

  if (/ipad|tablet|android(?!.*mobile)/.test(ua)) {
    return "tablet";
  }

  return "desktop";
}


function getSessionDevice(events: Events[], sessionId: string) {
  const event = events.find((e) => e.sessionId === sessionId);

  const device = parseDeviceFromUA(event?.userAgent);

  console.log(
    "[getSessionDevice]",
    "session:",
    sessionId,
    "userAgent:",
    event?.userAgent,
    "device:",
    device
  );

  return device;
}


const Table = ({ events, decrement, stepdirection }: TableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [activity, setActivity] = useState(1);
  const [data, setData] = useState<Events[]>([]);
  const [session, setSession] = useState<string>("");

 const sessionRows = useMemo(() => {
  const map = new Map<string, Events>();
  events.forEach((e) => {
    if (!map.has(e.sessionId)) {
      map.set(e.sessionId, e);
    }
  });

  // Merge stepdirection info
  const rows = Array.from(map.values()).map((event) => {
    const stepInfo = stepdirection?.find(
      (s) => s.session_id === event.sessionId || s.sessionId === event.sessionId
    );
    return {
      ...event,
      is_returning_user: stepInfo?.is_returning_user ?? false,
      session_location: stepInfo?.location,
    };
  });

  return rows;
}, [events, stepdirection]);

  const columnHelper = createColumnHelper<any>();

  const columns = [
    // S/N
    columnHelper.display({
      id: "sn",
      header: () => <div className="font-figtree">S/N</div>,
      cell: (info) => (
        <span className="font-semibold font-figtree text-gray-700">{info.row.index + 1}</span>
      ),
    }),

    // Session ID
    columnHelper.accessor("sessionId", {
      header: () => (
        <div className="flex items-center gap-2 font-figtree">
          <FiUser className="text-blue-600" />
          Session ID
        </div>
      ),
      cell: (info) => <div className="font-figtree text-gray-700">{info.getValue()}</div>,
    }),

    // Date Visited
    columnHelper.accessor("timestamp", {
      header: ({ column }) => (
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => column.toggleSorting()}
        >
          <FiClock className="text-purple-600" />
          <span className="font-figtree"> Last Date Visited</span>
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

    // Referrer
    columnHelper.accessor("referrer", {
      header: () => <div className="font-figtree">Referrer</div>,
      cell: (info) => <div className="font-figtree">{info.getValue() || "None"}</div>,
    }),

    
    // Browser
    columnHelper.accessor("userAgent", {
      header: () => (
        <div className="flex items-center gap-2 font-figtree">
          <CiGlobe size={15} className="text-purple-500" />
          Browser
        </div>
      ),
      cell: (info) => <div className="font-figtree">{parseBrowser(info.getValue())}</div>,
    }),

// Device
columnHelper.display({
  id: "device",
  header: () => (
    <div className="flex items-center gap-2 font-figtree">
      <span className="text-purple-600">💻</span>
      Device
    </div>
  ),
  cell: (info) => {
    const sessionId = info.row.original.sessionId;
    const device = getSessionDevice(events, sessionId);

    const color =
      device === "mobile"
        ? "font-figtree"
        : device === "tablet"
        ? "font-figtree"
        : device === "desktop"
        ? "font-figtree"
        : "text-gray-500";

    return (
      <span className={`font-figtree  capitalize ${color}`}>
        {device}
      </span>
    );
  },
}),


    // Location
    columnHelper.display({
      id: "location",
      header: () => (
        <div className="flex items-center gap-2 font-figtree">
          <FaLocationDot className="text-purple-600" />
          Location
        </div>
      ),
      cell: (info) => {
        // For this session row, find first event with location
        const eventsForSession = events.filter(
          (e) => e.sessionId === info.row.original.sessionId
        );
        const firstWithLocation = eventsForSession.find((e) => e.payload?.location)
          ?.payload?.location;

        if (!firstWithLocation)
          return <span className="font-figtree text-gray-700">Unknown</span>;

        const city = firstWithLocation.city;
        const country = firstWithLocation.country_name;

        return (
          <span className="font-figtree text-gray-700">
            {city && country ? `${city}, ${country}` : city || country || "Unknown"}
          </span>
        );
      },
    }),


columnHelper.display({
  id: "user_status",
  header: () => <div className="font-figtree">User Type</div>,
  cell: (info) => {
    const isReturning = info.row.original.is_returning_user;
    return (
      <span
        className={`font-figtree font-semibold ${
          isReturning ? "text-gray-700" : "text-green-500"
        }`}
      >
        {isReturning ? "Returning" : "New User"}
      </span>
    );
  },
}),


    // Action
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
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleViewMore = (sessionId: string) => {
    const relatedEvents = events.filter((e) => e.sessionId === sessionId);
    console.log("All events for session:", sessionId, relatedEvents);
    setSession(sessionId);
    setData(relatedEvents);
    setActivity((prev) => prev + 1);
  };

  const Back = () => {
    setActivity((prev) => prev - 1);
  };

  return (
    <>
      {activity === 1 && (
        <>
          <FaLongArrowAltLeft
            size={25}
            className="mb-6 ml-4 cursor-pointer"
            onClick={decrement}
          />
          <div className="p-5 bg-white rounded-2xl shadow-md border border-gray-200 ">
            <h2 className="text-xl font-bold mb-4 text-gray-800 font-figtree">
              Session Activity
            </h2>

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
      )}

      {activity === 2 && <Activity dataa={data} Back={Back} session={session} />}
    </>
  );
};

export default Table;
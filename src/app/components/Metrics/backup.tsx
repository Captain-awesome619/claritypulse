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

type Event = {
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
  const link = useProfileStore((state) => state.link); // projectId
  const [events, setEvents] = useState<Event[]>([]);
  const [showUsers, setShowUsers] = useState(false);

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
      const flattenedEvents: Event[] = data?.flatMap((item: any) =>
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

  const mouseCount = allEvents.filter((e) => e.type === "mouse").length;
  const clickCount = allEvents.filter(
    (e) => e.type === "mouse" && e.payload?.eventType === "click"
  ).length;

  const sessionDuration = (() => {
    if (allEvents.length === 0) return 0;
    const first = new Date(allEvents[0].timestamp).getTime();
    const last = new Date(allEvents[allEvents.length - 1].timestamp).getTime();
    return Math.round((last - first) / 1000);
  })();

  const uniqueVisitorsSet = new Map<string, string>();
  allEvents.forEach((e) => {
    if (!uniqueVisitorsSet.has(e.sessionId)) {
      uniqueVisitorsSet.set(e.sessionId, parseBrowser(e.userAgent));
    }
  });
  const uniqueVisitors = uniqueVisitorsSet.size;

  const avgScroll =
    scrollData.reduce((acc, s) => acc + s.depth, 0) / (scrollData.length || 1);

  return (
    <div className="space-y-10 p-6 w-full">
      {/* CARDS */}
      <Grid numItemsMd={4} numItemsLg={4} numItemsSm={2} className="gap-6">
        <Card
          decoration="top"
          decorationColor="blue"
          className="cursor-pointer"
          onClick={() => setShowUsers(!showUsers)}
        >
          <Flex className="justify-between">
            <div>
              <Text>Total Visitors</Text>
              <Metric>{uniqueVisitors}</Metric>
            </div>
            <Users size={30} className="text-blue-500" />
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="violet">
          <Flex className="justify-between">
            <div>
              <Text>Mouse Interactions</Text>
              <Metric>{mouseCount}</Metric>
            </div>
            <MousePointerClick size={30} className="text-violet-500" />
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="pink">
          <Flex className="justify-between">
            <div>
              <Text>Avg Scroll Depth(px)</Text>
              <Metric>{avgScroll.toFixed(1)}</Metric>
            </div>
            <ScrollText size={30} className="text-pink-500" />
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="green">
          <Flex className="justify-between">
            <div>
              <Text>Session Length (sec)</Text>
              <Metric>{sessionDuration}</Metric>
            </div>
            <Timer size={30} className="text-green-500" />
          </Flex>
        </Card>
      </Grid>

      {/* User Details */}
      {showUsers && (
        <Grid numItemsMd={3} className="gap-4">
          {Array.from(uniqueVisitorsSet.entries()).map(([sessionId, browser]) => (
            <Card key={sessionId}>
              <Text>Session: {sessionId}</Text>
              <Text>Browser: {browser}</Text>
            </Card>
          ))}
        </Grid>
      )}

      {/* CHARTS */}
      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>Scroll Depth Over Time</Title>
          <Text>Tracks how deep users scroll</Text>
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
          <Title>Mouse Events</Title>
          <Text>Hover, click & movement frequency</Text>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={[
                { name: "Mouse Events", value: mouseCount },
                { name: "Clicks", value: clickCount },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      <Card>
        <Title>Event Type Breakdown</Title>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: "Scroll", value: scrollData.length },
                { name: "Mouse", value: mouseCount },
                { name: "Clicks", value: clickCount },
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
  );
}

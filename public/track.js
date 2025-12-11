(() => {
  const TRACK_URL = "http://localhost:3000/api/track";

  const currentScript = document.currentScript;
  const apiKey = currentScript ? currentScript.getAttribute("data-key") : null;
  if (!apiKey) {
    console.error("Tracking script: No API key found on the <script> tag!");
    return;
  }

  // ------------------------------
  // Persistent userId (per browser)
  let userId = localStorage.getItem("tracker_user_id");
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("tracker_user_id", userId);
  }

  // ------------------------------
  // New session ID per tab
  const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ------------------------------
  // Fetch user location
  async function fetchLocation() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      return await res.json();
    } catch (err) {
      console.warn("Client location lookup failed:", err);
      return null;
    }
  }

  async function initTracker() {
    const userLocation = await fetchLocation();

    // Load rrweb
    const rrwebScript = document.createElement("script");
    rrwebScript.src = "https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js";
    document.head.appendChild(rrwebScript);

    rrwebScript.onload = () => {
      console.log("rrweb loaded");
      startTracker(userLocation);
    };
  }

  function startTracker(userLocation) {
    if (!apiKey) return;

    const eventQueue = [];
    const flushInterval = 2000;

    const flushEvents = () => {
      if (!eventQueue.length) return;

      const payload = eventQueue.slice();
      eventQueue.length = 0;

      const body = JSON.stringify({
        apiKey,
        userId,   // ⬅ Send persistent userId
        sessionId,
        events: payload
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(TRACK_URL, body);
      } else {
        fetch(TRACK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }).catch((err) => console.error("Failed to send events:", err));
      }
    };

    setInterval(flushEvents, flushInterval);

    const pushEvent = (type, data = {}) => {
      eventQueue.push({
        type,
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        payload: { ...data, location: userLocation || null },
      });
    };

    // Initial pageview
    pushEvent("pageview");

    // Click, scroll, mousemove, timing, rrweb logic here...
    document.addEventListener("click", (e) => {
      const target = e.target;
      pushEvent("click", {
        x: e.clientX,
        y: e.clientY,
        element: target.tagName,
        id: target.id || null,
        className: target.className || null,
      });
    });

    let lastScrollPercent = 0;
    window.addEventListener("scroll", () => {
      const percent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (percent !== lastScrollPercent) {
        pushEvent("scroll", { scrollDepth: percent });
        lastScrollPercent = percent;
      }
    });

    let lastMove = 0;
    document.addEventListener("mousemove", (e) => {
      const now = Date.now();
      if (now - lastMove > 200) {
        pushEvent("mouse", { x: e.clientX, y: e.clientY });
        lastMove = now;
      }
    });

    const startTime = Date.now();
    window.addEventListener("beforeunload", () => {
      pushEvent("timing", { duration: Math.round((Date.now() - startTime) / 1000) });
      flushEvents();
    });

    rrweb.record({ emit: (event) => pushEvent("rrweb", event) });
    window._debugFlushEvents = flushEvents;
  }

  initTracker();
})();

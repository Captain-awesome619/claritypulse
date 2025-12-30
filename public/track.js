(() => {
  const TRACK_URL = "https://claritypulse.onrender.com/api/track";

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
  // ✅ DEVICE DETECTION (BEST OPTION)
  function getDeviceInfo() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const hasTouch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    let type = "desktop";
    if (width <= 768 && hasTouch) type = "mobile";
    else if (width <= 1024 && hasTouch) type = "tablet";

    return {
      type,
      screen: { width, height },
      touch: hasTouch,
    };
  }

  // Capture once per session
  const deviceInfo = getDeviceInfo();

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
    rrwebScript.src =
      "https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js";
    document.head.appendChild(rrwebScript);

    rrwebScript.onload = () => {
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
        userId,
        sessionId,
        events: payload,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(TRACK_URL, body);
      } else {
        fetch(TRACK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }).catch(() => {});
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
        payload: {
          ...data,
          device: deviceInfo, // ✅ DEVICE INFO ADDED HERE
          location: userLocation || null,
        },
      });
    };

    // ------------------------------
    // Initial pageview
    pushEvent("pageview");

    // Click tracking
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

    // Scroll tracking
    let lastScrollPercent = 0;
    window.addEventListener("scroll", () => {
      const percent = Math.round(
        (window.scrollY /
          (document.body.scrollHeight - window.innerHeight)) *
          100
      );
      if (percent !== lastScrollPercent) {
        pushEvent("scroll", { scrollDepth: percent });
        lastScrollPercent = percent;
      }
    });

    // Mouse movement
    let lastMove = 0;
    document.addEventListener("mousemove", (e) => {
      const now = Date.now();
      if (now - lastMove > 200) {
        pushEvent("mouse", { x: e.clientX, y: e.clientY });
        lastMove = now;
      }
    });

    // Session duration
    const startTime = Date.now();
    window.addEventListener("beforeunload", () => {
      pushEvent("timing", {
        duration: Math.round((Date.now() - startTime) / 1000),
      });
      flushEvents();
    });

    // rrweb
    rrweb.record({
      emit: (event) => pushEvent("rrweb", event),
    });

    window._debugFlushEvents = flushEvents;
  }

  initTracker();
})();

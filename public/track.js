(() => {
  // 1️⃣ Enter your full API endpoint here (your deployed Next.js app URL)
  const TRACK_URL = "http://localhost:3000/api/track"; // <-- REPLACE with your deployed URL if testing on another domain

  // Read API key from <script> tag
  const currentScript = document.currentScript;
  const apiKey = currentScript ? currentScript.getAttribute("data-key") : null;
  if (!apiKey) {
    console.error("Tracking script: No API key found on the <script> tag!");
    return;
  }

  // Create or retrieve persistent session ID
  let sessionId = localStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("session_id", sessionId);
  }(() => {
  // ================================
  // 0️⃣ Load rrweb recorder script
  // ================================
  const rrwebScript = document.createElement("script");
  rrwebScript.src = "https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js";
  document.head.appendChild(rrwebScript);

  rrwebScript.onload = () => {
    console.log("rrweb loaded");
    startTracker();
  };

  function startTracker() {
    // 1️⃣ API endpoint
    const TRACK_URL = "http://localhost:3000/api/track";

    // Read API key from script tag
    const currentScript = document.currentScript;
    const apiKey = currentScript ? currentScript.getAttribute("data-key") : null;
    if (!apiKey) {
      console.error("Tracking script: No API key found on the <script> tag!");
      return;
    }

    // 2️⃣ Persistent session ID
    let sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("session_id", sessionId);
    }

    // 3️⃣ Our event queue (analytics + rrweb mixed)
    const eventQueue = [];
    const flushInterval = 2000; // flush every 2 seconds

    const flushEvents = () => {
      if (eventQueue.length === 0) return;

      const payload = eventQueue.slice();
      eventQueue.length = 0;

      console.log("Flushing events:", payload);

      const body = JSON.stringify({ apiKey, events: payload });

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
        timestamp: new Date().toISOString(),
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        payload: data,
      });
    };

    // 4️⃣ Start standard tracking
    pushEvent("pageview");

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
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (percent !== lastScrollPercent) {
        pushEvent("scroll", { scrollDepth: percent });
        lastScrollPercent = percent;
      }
    });

    // Mouse movement tracking (throttled)
    let lastMove = 0;
    document.addEventListener("mousemove", (e) => {
      const now = Date.now();
      if (now - lastMove > 200) {
        pushEvent("mouse", { x: e.clientX, y: e.clientY });
        lastMove = now;
      }
    });

    // Time on page
    const startTime = Date.now();
    window.addEventListener("beforeunload", () => {
      pushEvent("timing", {
        duration: Math.round((Date.now() - startTime) / 1000),
      });
      flushEvents();
    });

    // =====================================
    // 5️⃣ rrweb session replay recorder
    // =====================================
    rrweb.record({
      emit(event) {
        // We wrap rrweb events inside our existing format
        pushEvent("rrweb", event);
      },
    });

    window._debugFlushEvents = flushEvents;
  }
})();


  // Event queue for batching
  const eventQueue = [];
  const flushInterval = 2000; // flush every 2 seconds

  const flushEvents = () => {
    if (eventQueue.length === 0) return;

    const payload = eventQueue.slice();
    eventQueue.length = 0; // clear queue

    // DEBUG: log what we're sending
    console.log("Flushing events:", payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        TRACK_URL,
        JSON.stringify({ apiKey, events: payload })
      );
    } else {
      fetch(TRACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, events: payload }),
      }).catch((err) => console.error("Failed to send events:", err));
    }
  };

  setInterval(flushEvents, flushInterval);

  const pushEvent = (type, data = {}) => {
    const event = {
      type,
      sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      payload: data,
    };
    eventQueue.push(event);
  };

  // Track pageview immediately
  pushEvent("pageview");

  // Track clicks
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

  // Track scroll depth (throttle)
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

  // Track mouse movement (throttle)
  let lastMove = 0;
  document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastMove > 200) {
      pushEvent("mouse", { x: e.clientX, y: e.clientY });
      lastMove = now;
    }
  });

  // Track time on page
  const startTime = Date.now();
  window.addEventListener("beforeunload", () => {
    pushEvent("timing", {
      duration: Math.round((Date.now() - startTime) / 1000),
    });
    flushEvents(); // flush before leaving
  });

  // DEBUG: flush remaining events if user presses F12 to see console
  window._debugFlushEvents = flushEvents;

})();

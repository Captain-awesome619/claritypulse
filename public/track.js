(() => {
  const TRACK_URL = "http://localhost:3000/api/track";

  const currentScript = document.currentScript;
  const apiKey = currentScript ? currentScript.getAttribute("data-key") : null;
  if (!apiKey) {
    console.error("Tracking script: No API key found on the <script> tag!");
    return;
  }

  let sessionId = localStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("session_id", sessionId);
  }

  // ==========================================
  // ✅ OPTION 1 — Fetch User Location via IP
  // ==========================================
  let userLocation = null;

  async function fetchLocation() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      return await res.json();
    } catch (err) {
      console.warn("Location lookup failed:", err);
      return null;
    }
  }

  fetchLocation().then((loc) => {
    userLocation = loc;
  });

  (() => {
    const rrwebScript = document.createElement("script");
    rrwebScript.src = "https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js";
    document.head.appendChild(rrwebScript);

    rrwebScript.onload = () => {
      console.log("rrweb loaded");
      startTracker();
    };

    function startTracker() {
      const TRACK_URL = "http://localhost:3000/api/track";
      const currentScript = document.currentScript;
      const apiKey = currentScript ? currentScript.getAttribute("data-key") : null;

      if (!apiKey) return;

      let sessionId = localStorage.getItem("session_id");
      if (!sessionId) {
        sessionId = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("session_id", sessionId);
      }

      const eventQueue = [];
      const flushInterval = 2000;

      const flushEvents = () => {
        if (eventQueue.length === 0) return;

        const payload = eventQueue.slice();
        eventQueue.length = 0;

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

          // -----------------------------------------
          // ✅ LOCATION ADDED INSIDE EVENT PAYLOAD
          // -----------------------------------------
          payload: {
            ...data,
            location: userLocation,
          },
        });
      };

      // Start tracking
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
        pushEvent("timing", {
          duration: Math.round((Date.now() - startTime) / 1000),
        });
        flushEvents();
      });

      rrweb.record({
        emit(event) {
          pushEvent("rrweb", event);
        },
      });

      window._debugFlushEvents = flushEvents;
    }
  })();

  // ==========================================
  // Second queue block (your duplicated logic)
  // ==========================================

  const eventQueue = [];
  const flushInterval = 2000;

  const flushEvents = () => {
    if (eventQueue.length === 0) return;

    const payload = eventQueue.slice();
    eventQueue.length = 0;

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
      });
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

      // -----------------------------------------
      // ✅ LOCATION ADDED HERE TOO
      // -----------------------------------------
      payload: {
        ...data,
        location: userLocation,
      },
    });
  };

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
    pushEvent("timing", {
      duration: Math.round((Date.now() - startTime) / 1000),
    });
    flushEvents();
  });

  window._debugFlushEvents = flushEvents;
})();

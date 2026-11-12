// Welcome page logic from Captain Builders lesson 3.2.2.
// Shows the "pin" guide or the "usage" guide depending on whether the
// extension icon is pinned to the Chrome toolbar right now.
(function () {
  "use strict";

  // TODO: replace with the Chrome Web Store item ID once the item is created in CWS (lesson 3.6).
  // Until then the page uses the ID passed in the link (?id=...), which works for developer-mode installs.
  var STORE_EXTENSION_ID = "REPLACE_WITH_CWS_ITEM_ID";
  var POLL_INTERVAL_MS = 1500;

  var params = new URLSearchParams(location.search);
  // Use the ID from the link (developer-mode installs differ), else the store ID.
  var extensionId = /^[a-p]{32}$/.test(params.get("id") || "") ? params.get("id") : STORE_EXTENSION_ID;
  var manual = false;     // the user picked a mode by hand
  var reachable = /^[a-p]{32}$/.test(extensionId); // the extension answers our messages
  var pollTimer = 0;

  function setMode(mode) {
    if (mode === "pin" || mode === "usage") document.body.dataset.mode = mode;
  }

  function stopPolling() { clearInterval(pollTimer); pollTimer = 0; }

  // Ask the extension whether its icon is on the toolbar right now.
  function checkPinState() {
    if (manual || !reachable) return;
    var runtime = window.chrome && chrome.runtime;
    // chrome.runtime exists here only thanks to externally_connectable.
    if (!runtime || typeof runtime.sendMessage !== "function") { reachable = false; stopPolling(); return; }
    runtime.sendMessage(extensionId, { type: "getPinState" }, function (reply) {
      if (runtime.lastError) {   // not installed, disabled or an old version
        reachable = false; stopPolling(); return;
      }
      if (!manual && reply && typeof reply.isOnToolbar === "boolean") {
        setMode(reply.isOnToolbar ? "usage" : "pin");
      }
    });
  }

  // Start: hash > link hint > default.
  var hash = location.hash.slice(1);
  if (hash === "pin" || hash === "usage") {
    manual = true; setMode(hash);
  } else {
    setMode(params.get("pinned") === "1" ? "usage" : "pin");
    checkPinState();
    pollTimer = setInterval(function () {
      if (document.visibilityState === "visible") checkPinState();
    }, POLL_INTERVAL_MS);
  }

  // Re-check as soon as the user comes back from the toolbar.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") checkPinState();
  });

  // Manual switch links always win.
  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-switch]");
    if (!link) return;
    e.preventDefault();
    manual = true; stopPolling();
    setMode(link.dataset.switch);
    history.replaceState(null, "", "#" + link.dataset.switch);
  });
})();

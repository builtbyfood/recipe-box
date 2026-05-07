// ==UserScript==
// @name         Send to Recipe Box
// @namespace    https://github.com/travisdeluca/ha-recipe-box
// @version      0.1.0
// @description  Drops a "Send to Recipe Box" button on recipe pages — taps post the rendered HTML to your HA webhook, bypassing Cloudflare/bot protection.
// @author       Travis DeLuca
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ===========================================================================
  // CONFIG — set your webhook URL once. Stored in Tampermonkey's per-script
  // storage so you don't have to re-enter it on every page.
  // ===========================================================================
  const STORAGE_KEY = "recipe_box_webhook_url";
  const DEFAULT_URL =
    "http://homeassistant.local:8123/api/webhook/recipe-box-share-CHANGE-ME";

  function getWebhookUrl() {
    const saved = GM_getValue(STORAGE_KEY, "");
    return saved || DEFAULT_URL;
  }

  function promptForUrl() {
    const current = GM_getValue(STORAGE_KEY, DEFAULT_URL);
    const next = prompt("Recipe Box webhook URL:", current);
    if (next && next.startsWith("http")) {
      GM_setValue(STORAGE_KEY, next.trim());
      alert("Saved. Reload the page for it to take effect.");
    }
  }

  // Tampermonkey menu so you can update the URL later without editing this file
  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand("Configure Recipe Box webhook", promptForUrl);
  }

  // ===========================================================================
  // Detect whether the current page looks like a recipe.
  // ===========================================================================
  function isRecipePage() {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (matchesRecipe(item)) return true;
        }
      } catch (e) {
        // Some sites have malformed JSON-LD; ignore and keep checking
      }
    }
    // Fallback: microdata or itemtype
    if (document.querySelector('[itemtype*="schema.org/Recipe"]')) return true;
    return false;
  }

  function matchesRecipe(item) {
    if (!item || typeof item !== "object") return false;
    const t = item["@type"];
    if (t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"))) {
      return true;
    }
    // Some sites bundle multiple types under @graph
    if (Array.isArray(item["@graph"])) {
      return item["@graph"].some(matchesRecipe);
    }
    return false;
  }

  // ===========================================================================
  // The button
  // ===========================================================================
  function injectButton() {
    if (document.getElementById("recipe-box-send-btn")) return;

    const btn = document.createElement("button");
    btn.id = "recipe-box-send-btn";
    btn.innerHTML = "&#128229; Send to Recipe Box";
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      padding: 12px 20px;
      background: #1976d2;
      color: white;
      border: 0;
      border-radius: 24px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      cursor: pointer;
      transition: transform 0.1s, opacity 0.2s;
      opacity: 0.92;
    `;
    btn.onmouseenter = () => {
      btn.style.transform = "translateY(-2px)";
      btn.style.opacity = "1";
    };
    btn.onmouseleave = () => {
      btn.style.transform = "";
      btn.style.opacity = "0.92";
    };
    btn.onclick = sendToRecipeBox;
    document.body.appendChild(btn);
  }

  function setBtnState(text, color, restoreAfter) {
    const btn = document.getElementById("recipe-box-send-btn");
    if (!btn) return;
    btn.innerHTML = text;
    btn.style.background = color;
    btn.disabled = true;
    if (restoreAfter) {
      setTimeout(() => {
        btn.innerHTML = "&#128229; Send to Recipe Box";
        btn.style.background = "#1976d2";
        btn.disabled = false;
      }, restoreAfter);
    }
  }

  function sendToRecipeBox() {
    const url = getWebhookUrl();
    if (url.includes("CHANGE-ME")) {
      promptForUrl();
      return;
    }

    setBtnState("&#9203; Sending...", "#757575");

    // Strip heavy non-recipe content to keep the POST body small.
    const clone = document.documentElement.cloneNode(true);
    clone
      .querySelectorAll(
        "img, svg, style, iframe, video, audio, noscript, link, picture, source"
      )
      .forEach((el) => el.remove());

    // GM_xmlhttpRequest bypasses CORS — we can POST to homeassistant.local
    // from any origin, which a regular fetch() can't do.
    GM_xmlhttpRequest({
      method: "POST",
      url: url,
      data: JSON.stringify({
        url: location.href,
        html: clone.outerHTML,
      }),
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
      onload: (response) => {
        if (response.status >= 200 && response.status < 300) {
          setBtnState("&#10003; Sent", "#43a047", 2500);
        } else {
          setBtnState(
            `&#10006; HTTP ${response.status}`,
            "#e53935",
            3500
          );
        }
      },
      onerror: () => {
        setBtnState("&#10006; Network error", "#e53935", 3500);
      },
      ontimeout: () => {
        setBtnState("&#10006; Timeout", "#e53935", 3500);
      },
    });
  }

  // ===========================================================================
  // Init
  // ===========================================================================
  function init() {
    if (isRecipePage()) {
      injectButton();
    }
  }

  // Some sites lazy-render their JSON-LD. Re-check on DOM changes for the
  // first ~5 seconds after load.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  let attempts = 0;
  const interval = setInterval(() => {
    if (document.getElementById("recipe-box-send-btn") || ++attempts > 10) {
      clearInterval(interval);
      return;
    }
    init();
  }, 500);
})();

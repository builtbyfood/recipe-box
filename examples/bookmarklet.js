// Recipe Box bookmarklet — source for reference.
//
// Save the one-liner BELOW as a browser bookmark (paste into the URL field
// of a new bookmark). When you're on a recipe page, tap the bookmark to
// send it to Home Assistant.
//
// What this does that "share URL only" doesn't: grabs the rendered page
// HTML (with your browser cookies / Cloudflare clearance) and sends it
// alongside the URL. The HA backend parses the HTML directly instead of
// re-fetching, so Cloudflare-protected sites (Food Network, NYT Cooking,
// Bon Appétit, etc.) work.
//
// CONFIGURE: replace WEBHOOK_URL with your actual webhook URL before saving.

// ---------- Readable source ----------
(function () {
  const WEBHOOK_URL =
    "http://homeassistant.local:8123/api/webhook/recipe-box-share-CHANGE-ME";

  // Strip heavy non-recipe content to keep the POST body small. JSON-LD,
  // microdata, and all text content are preserved — that's what the
  // parser needs.
  const clone = document.documentElement.cloneNode(true);
  clone
    .querySelectorAll("img, svg, style, iframe, video, audio, noscript, link")
    .forEach((el) => el.remove());
  const html = clone.outerHTML;

  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: location.href, html }),
  })
    .then((r) => {
      if (r.ok) {
        // Tiny visual confirmation. Replace with a nicer toast if you want.
        alert("Sent to Recipe Box ✓");
      } else {
        alert("Recipe Box: HTTP " + r.status);
      }
    })
    .catch((e) => alert("Recipe Box error: " + e.message));
})();

// ---------- One-liner to save as bookmark URL ----------
// Copy everything between the BEGIN/END markers (including "javascript:")
// into the URL field of a new browser bookmark.
//
// BEGIN BOOKMARKLET ↓
// javascript:(function(){var W='http://homeassistant.local:8123/api/webhook/recipe-box-share-CHANGE-ME';var c=document.documentElement.cloneNode(true);c.querySelectorAll('img,svg,style,iframe,video,audio,noscript,link').forEach(function(e){e.remove();});fetch(W,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:location.href,html:c.outerHTML})}).then(function(r){alert(r.ok?'Sent to Recipe Box':'Recipe Box: HTTP '+r.status);}).catch(function(e){alert('Recipe Box error: '+e.message);});})();
// END BOOKMARKLET ↑

# Recipe Box Share — PWA

A tiny installable web app that registers itself as a system share target.
Once installed on your phone, "Recipe Box" appears in the share sheet of
every app — Chrome, Reddit, Discord, X, anywhere — and tapping it sends
the URL to your HA webhook.

No app stores. No 3rd-party apps. The PWA is served from your own HA
instance under `/local/recipe-box-share/`.

## How it works

```
[Any app on phone] ─share─▶ [System share sheet] ─tap "Recipe Box"─▶
[PWA opens with URL as query param] ─POST─▶ [Your HA webhook] ─▶
[Your existing automation] ─▶ [Recipe imported, notification sent]
```

The PWA itself is ~14KB total. It's online-only (no offline caching) and
its only job is to read the shared URL and POST it to your webhook.

## Requirements

**HTTPS access to your HA instance.** This is non-negotiable for PWA
installation — Chrome refuses to install PWAs from non-secure HTTP origins
(except `localhost` / `127.0.0.1`). Practical options:

- **Nabu Casa Cloud** — easiest, automatic HTTPS via your cloud URL
- **Reverse proxy with Let's Encrypt** — Caddy, Traefik, NGINX
- **DuckDNS + Let's Encrypt addon** — common DIY setup

If you only have HTTP at `homeassistant.local:8123`, the PWA's share-target
won't register. You'd still be able to use the bookmarklet fallback.

## Installation

### 1. Drop files into HA

Copy this entire folder into `<HA config>/www/`:

```
<HA config>/www/recipe-box-share/
  index.html
  manifest.webmanifest
  sw.js
  icon-192.png
  icon-512.png
  icon-maskable-512.png
```

No HA restart needed — `www/` is served live as `/local/...`.

### 2. Install on your phone

Open Chrome on your phone, navigate to your HA instance via its **HTTPS
URL** (Nabu Casa cloud URL, your domain, etc.), then to:

```
https://YOUR-HA-URL/local/recipe-box-share/
```

You should see the Recipe Box landing page. Tap the ⋮ menu in Chrome
→ "Install app" (or "Add to Home Screen"). Chrome will register the PWA
and add it to your home screen.

### 3. Configure the webhook ID

Tap the installed Recipe Box icon on your home screen. First launch shows
the home page with a "Settings" button. Open settings and enter:

- **Webhook ID** — the random string from your `share-target-automation.yaml`
  (just the ID, not the full URL — e.g. `recipe-box-share-abc123def456`)
- **Mobile dashboard path** — the path the PWA opens after a successful
  import. Default `/recipes-mobile/recipes` matches the example dashboard.

Save. The PWA stores these in your phone's localStorage; you'll never
need to enter them again unless you uninstall.

### 4. Use it

Open any recipe site in any app. Hit the system share button. "Recipe Box"
appears alongside Messenger, Gmail, etc. Tap it.

The PWA opens, shows "Importing...", POSTs to your webhook, then shows
either ✓ (with a button to open the Recipe Box dashboard) or ✗ (with a
retry button and the underlying error).

## Cloudflare/blocked sites

The PWA only sends the URL — same as a phone-side share would. For sites
behind Cloudflare (Food Network, NYT Cooking, Bon Appétit), use the
bookmarklet instead. The bookmarklet runs *inside* the source page and
captures the rendered HTML with your browser's cookies, bypassing the
bot protection.

You can have both installed: PWA for fast 1-tap import on most sites,
bookmarklet for the few that block server-side fetches.

## Troubleshooting

**"Install app" doesn't appear in Chrome's menu**
- You're on an HTTP URL. The PWA install criteria require HTTPS.
- Or the service worker didn't register (check DevTools → Application →
  Service Workers in desktop Chrome — the same files, same problem).

**Share sheet doesn't show "Recipe Box"**
- The PWA isn't installed. Adding to home screen via Chrome's "Add to
  Home Screen" doesn't register share-target — you need "Install app".
- Some launchers cache the share-sheet menu — reboot phone if it
  stubbornly won't appear.

**Tap "Recipe Box" in share sheet, page opens but says "Webhook not configured"**
- Open the PWA directly from your home screen first, go to Settings,
  enter your webhook ID. Save. Then the share-target flow works.

**Import shows ✗ HTTP 502**
- Server-side fetch failed. The site has bot protection. Use the
  bookmarklet for that URL instead.

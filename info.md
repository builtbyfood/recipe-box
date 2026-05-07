# Recipe Box

Self-hosted recipe ingester + dashboard card. Imports from URLs,
free-text paste, PDFs, or photos. Stores everything as portable
schema.org Recipe JSON-LD on a folder you control.

This repo provides **both** the integration (backend) and the
Lovelace card (dashboard UI). HACS treats them as separate items —
add this repo URL twice, once as **Integration**, once as **Lovelace**.

After installation:
1. Restart HA, then **Settings → Devices & Services → Add
   Integration → Recipe Box**
2. Hard-refresh your dashboard to pick up the card
3. (Optional) Import the share-sheet automation blueprint from
   `blueprints/share-event.yaml` for one-tap mobile imports

See the README for full configuration, service reference, and example
dashboard YAMLs.

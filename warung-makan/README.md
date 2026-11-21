# Warung Makan — Indonesian food stall (demo)

A small Indonesian food-stall site for the Open Agentic Web Challenge. English UI,
Indonesian dish names, prices in whole rupiah (IDR). The assistant answers menu
questions from the page's real data, adds dishes to the cart, and places a demo
pickup or delivery order after the visitor confirms it in the browser's dialog.
No payment is taken and no food is sent.

## Run locally

The warung is linked to Ojek Kilat, so serve both sites:

```sh
node skills/agentify-website/scripts/serve_site.mjs warung-makan --port 8080 --open-as 127.0.0.1
node skills/agentify-website/scripts/serve_site.mjs ojek-kilat --port 8081 --open-as localhost
```

Then open <http://127.0.0.1:8080/>.

## Files

- `index.html` — menu, cart, demo checkout form, assistant section.
- `styles.css` — page styles plus the assistant chat styles.
- `js/warung-data.js` — the menu, the delivery fees and the page facts. The single
  source of truth: the page, the actions and the action bridge all read it.
- `script.js` — the page: menu, cart and demo checkout (`App.page`).
- `site-actions.js` — the assistant's actions: `get_warung_state` (read),
  `add_to_cart` and `set_cart` (writes), `checkout_demo_order` (irreversible).
- `site.js` — mounts the assistant and its confirmation dialog.
- `chat-follow.js` — follows the chat when the page scrolls.
- `warung_makan.hocon` — the network source of truth; build it with
  `node skills/agentify-website/scripts/build_network.mjs warung_makan.hocon --manifest agent-manifest.json --check`.
- `warung_makan.network.json`, `agent-manifest.json`, `links.json`, `agent-mcp.json`,
  `.well-known/` — published by the build.
- `bridge/bridge-actions.js` — shares `get_warung_state` (public facts only, never
  the cart) with any site.
- `runtime/` — the browser runtime, copied unchanged from the skill.
- `tests/` — Node tests (`node --test "tests/*.test.mjs"`): the template's
  integration checks plus the cart math, the set action, the page buttons, the fee
  table match with Ojek Kilat, and the empty-cart refusal. `warung-flow.test.mjs`
  runs the verifiable flow on a fresh page: add two nasi goreng, checkout for
  delivery to Zone B, total Rp62.000, order `WM-…` received.

## Data leaves the page

The menu, delivery fees and facts live in `js/warung-data.js`, a pure data module
with no DOM at load. `script.js` renders them into the page, `site-actions.js`
reads them through `App.page`, and the bridge reads them directly — so the
assistant, the dialog and the partner site all answer from the same data. The
visitor's cart never leaves the page: the bridge shares only the public facts.

## Network

- Network name: `warung_makan`; front agent: `warung_assistant`.
- Live network URL: `https://adara1992.github.io/warung-makan-agent/warung-makan/warung_makan`.
- Hosted on GitHub Pages at `https://adara1992.github.io/warung-makan-agent/warung-makan/`. The partner URLs in `warung_makan.hocon` (partner tool, `link_labels`), `agent-manifest.json` (`allowed_peers`), and the page's partner link in `js/warung-data.js` all point at the live Ojek Kilat URLs; rebuild after changing them.

## Linked site

Ojek Kilat (`https://adara1992.github.io/warung-makan-agent/ojek-kilat/ojek_kilat`) quotes delivery after the visitor
agrees: the warung asks it for a zone's fee and time window, and gives the visitor
its fee, its window and its link. The warung charges exactly the courier's
published fees — a test checks the two fee tables match.

## Hosting headers

Hosted on GitHub Pages: no custom headers are possible there. The two sites share the origin `https://adara1992.github.io`, so their calls to each other are same-origin and need no CORS headers.

On Netlify and compatible hosts, put this in a `_headers` file at the site root:

```text
/agent-manifest.json
  Access-Control-Allow-Origin: *
/warung_makan.network.json
  Access-Control-Allow-Origin: *
/links.json
  Access-Control-Allow-Origin: *
/agent-mcp.json
  Access-Control-Allow-Origin: *
/.well-known/nsdeploy.json
  Access-Control-Allow-Origin: *
/.well-known/nsdeploy-agent.json
  Access-Control-Allow-Origin: *
/runtime/sandbox-worker.js
  Content-Security-Policy: default-src 'none'; script-src blob:; connect-src 'none'; worker-src 'none'
```

On Apache, put this in `.htaccess`:

```apache
<IfModule mod_headers.c>
  <FilesMatch "^(agent-manifest\.json|warung_makan\.network\.json|links\.json|agent-mcp\.json|nsdeploy\.json|nsdeploy-agent\.json)$">
    Header always set Access-Control-Allow-Origin "*"
  </FilesMatch>
  <Files "sandbox-worker.js">
    Header always set Content-Security-Policy "default-src 'none'; script-src blob:; connect-src 'none'; worker-src 'none'"
  </Files>
</IfModule>
```

Use HTTPS in production: the visitor's key is stored in the browser for this
origin, and any script on the page can read it. Load no third-party scripts.

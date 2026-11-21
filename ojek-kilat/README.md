# Ojek Kilat — motorbike courier (demo)

A tiny courier site for the Open Agentic Web Challenge. It quotes delivery fees
and time windows for Zones A–C, and nothing else: no bookings, no real-time
tracking, no payment. Warung Makan calls it as a partner site after the visitor
agrees, to quote delivery for an order.

## Run locally

```sh
node skills/agentify-website/scripts/serve_site.mjs ojek-kilat --port 8081 --open-as localhost
```

Then open <http://localhost:8081/>. To see the linked pair, also serve Warung
Makan on port 8080:

```sh
node skills/agentify-website/scripts/serve_site.mjs warung-makan --port 8080 --open-as 127.0.0.1
```

## Files

- `index.html` — delivery zones, fees, assistant section.
- `styles.css` — page styles plus the assistant chat styles.
- `js/ojek-data.js` — the zones, fees and page facts. The single source of truth:
  the page, the actions and the action bridge all read it.
- `script.js` — the page: renders the zones and quotes delivery (`App.page`).
- `site-actions.js` — the assistant's actions, both reads: `get_ojek_state` and
  `quote_delivery`. There is no write and no irreversible action.
- `site.js` — mounts the assistant. No confirmation dialog words: there is
  nothing to confirm.
- `chat-follow.js` — follows the chat when the page scrolls.
- `ojek_kilat.hocon` — the network source of truth; build it with
  `node skills/agentify-website/scripts/build_network.mjs ojek_kilat.hocon --manifest agent-manifest.json --check`.
- `ojek_kilat.network.json`, `agent-manifest.json`, `links.json`, `agent-mcp.json`,
  `.well-known/` — published by the build.
- `bridge/bridge-actions.js` — shares `get_ojek_state` and `quote_delivery` with
  Warung Makan only (`https://adara1992.github.io`).
- `runtime/` — the browser runtime, copied unchanged from the skill.
- `tests/` — Node tests (`node --test "tests/*.test.mjs"`): network validity, the
  manifest and bridge match, the read action through the agent, each zone's quote,
  the three-zone table, and the fee table match with Warung Makan.

## Data leaves the page

The zones, fees and facts live in `js/ojek-data.js`, a pure data module with no
DOM at load. `script.js` renders them into the page, `site-actions.js` reads them
through `App.page`, and the bridge reads them directly — so the assistant and the
partner site answer from the same data. The warung charges exactly these fees: a
test on each site checks the two fee tables match.

## Network

- Network name: `ojek_kilat`; front agent: `ojek_assistant`.
- Live network URL: `https://adara1992.github.io/warung-makan-agent/ojek-kilat/ojek_kilat`.
- Hosted on GitHub Pages at `https://adara1992.github.io/warung-makan-agent/ojek-kilat/`. The bridge's `callerOrigins` and the page's partner link in `js/ojek-data.js` point at the live Warung Makan URLs; rebuild after changing them.

## Linked site

Warung Makan (`https://adara1992.github.io/warung-makan-agent/warung-makan/warung_makan`) is the only site that calls
this network. Its assistant asks Ojek Kilat for a zone's fee and time window
after the visitor agrees.

## Hosting headers

Hosted on GitHub Pages: no custom headers are possible there. The two sites share the origin `https://adara1992.github.io`, so their calls to each other are same-origin and need no CORS headers.

On Netlify and compatible hosts, put this in a `_headers` file at the site root:

```text
/agent-manifest.json
  Access-Control-Allow-Origin: *
/ojek_kilat.network.json
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
  <FilesMatch "^(agent-manifest\.json|ojek_kilat\.network\.json|links\.json|agent-mcp\.json|nsdeploy\.json|nsdeploy-agent\.json)$">
    Header always set Access-Control-Allow-Origin "*"
  </FilesMatch>
  <Files "sandbox-worker.js">
    Header always set Content-Security-Policy "default-src 'none'; script-src blob:; connect-src 'none'; worker-src 'none'"
  </Files>
</IfModule>
```

Use HTTPS in production: the visitor's key is stored in the browser for this
origin, and any script on the page can read it. Load no third-party scripts.

# Warung Makan + Ojek Kilat — Open Agentic Web Challenge entry

Two small open agentic websites (spec: MVP Profile 0.3), built for the
[Open Agentic Web Challenge](https://cognizant-agenticweb.devpost.com/)
(deadline 11 January 2027).

- **Warung Makan** — an Indonesian food-stall site: menu in whole rupiah,
  halal/vegetarian/spice labels, cart, demo pickup/delivery checkout.
  Live: <https://adara1992.github.io/warung-makan-agent/warung-makan/>
- **Ojek Kilat** — its courier peer: delivery Zones A/B/C with fees and time
  windows, quote-only. The warung's assistant asks it for a delivery quote
  after the visitor agrees.
  Live: <https://adara1992.github.io/warung-makan-agent/ojek-kilat/>

Each site is a static bundle: public `agent-manifest.json` + `.network.json`,
a browser runtime, and an assistant that answers from the site's own data and
calls the site's own actions. No server, no paid services, no keys in the repo.
Tests: `node --test "warung-makan/tests/*.test.mjs" "ojek-kilat/tests/*.test.mjs"`
(28 tests, including the verifiable flow: two nasi goreng + delivery to Zone B
= Rp62.000).

Built from the challenge's official starter patterns; the two sites are
original work for this entry (Indonesian food stall + courier).

// The verifiable flow on a fresh Warung Makan page: "add two nasi goreng, checkout
// for delivery" through the agent, with a scripted model and no LLM key.
// Run: node --test "warung-makan/tests/*.test.mjs"
// This file runs in its own process, so the page starts empty: the cart version after
// the add is 1, and the checkout can name it.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ActionRegistry } from "../runtime/actions.js";
import { AgentNetwork } from "../runtime/kernel.js";
import { runAgent } from "../runtime/runner.js";
import { TraceBus } from "../runtime/trace.js";
import { StubDocument } from "./stub_document.mjs";
import { StubOption } from "./stub_option.mjs";
import { ScriptedModel } from "./scripted_model.mjs";

const NETWORK_NAME = "warung_makan";
const BASE = "http://127.0.0.1:8080";

globalThis.document = StubDocument.fromHtml(await readFile(new URL("../index.html", import.meta.url), "utf8"), `${BASE}/`);
globalThis.Option = StubOption;
const { registerActions } = await import("../site-actions.js");

test("add two nasi goreng, checkout for delivery: correct total, order received", async () => {
  const config = JSON.parse(await readFile(new URL(`../${NETWORK_NAME}.network.json`, import.meta.url), "utf8"));
  const manifest = JSON.parse(await readFile(new URL("../agent-manifest.json", import.meta.url), "utf8"));
  const network = new AgentNetwork(config, NETWORK_NAME);
  const registry = new ActionRegistry();
  await registerActions({
    register: registry.register.bind(registry, {base: BASE, network: NETWORK_NAME}),
  });
  // The dialog gate is tested in warung.test.mjs; here the approval stands in for the
  // visitor confirming, so the flow runs end to end.
  const model = new ScriptedModel([
    {
      tool: "website_add_to_cart",
      arguments: {id: "nasi-goreng", quantity: 2},
    },
    {
      tool: "website_checkout_demo_order",
      arguments: {
        customerName: "Flow Visitor",
        fulfillment: "delivery",
        zone: "B",
        address: "Jl. Merdeka No. 12",
        orderTime: "",
        expectedCartVersion: 1,
      },
    },
    {
      text: "Your demo order is placed.",
    },
  ]);
  const ctx = {
    network: network,
    manifest: manifest,
    actions: registry,
    baseOrigin: BASE,
    displayOrigin: new URL(BASE).host,
    trace: new TraceBus(),
    isTop: true,
    frontMan: network.findFrontMan(),
    history: [],
    llm: model,
    confirmWebsiteActions: async () => true,
  };
  const result = await runAgent(ctx, ctx.frontMan, "Add two nasi goreng and check out for delivery to Zone B.", null, []);
  // The model was offered both tools, called the add first and the checkout second.
  assert.ok(model.toolNames(0).includes("website_add_to_cart"));
  assert.ok(model.toolNames(0).includes("website_checkout_demo_order"));
  assert.equal(model.toolResults(1)[0].status, "succeeded");
  assert.deepEqual(model.toolResults(1)[0].result.cart, [{id: "nasi-goreng", quantity: 2}]);
  assert.equal(model.toolResults(1)[0].result.total, 50000);
  // Call 2's messages carry both tool results, in order: the add, then the checkout.
  const results = model.toolResults(2);
  assert.equal(results.length, 2);
  assert.equal(results.at(-1).status, "succeeded");
  assert.equal(results.at(-1).result.total, 62000);
  assert.match(result.text, /placed/);
  // The cart is empty and the order is stored: 2 × Rp25.000 + Zone B Rp12.000.
  const plan = registry.prepare({
    kind: "action",
    action: [...registry.catalog({base: BASE, network: NETWORK_NAME})].find((entry) => entry.name === "get_warung_state").ref,
    arguments: {},
  });
  const receipts = await registry.execute(plan, async () => true, "test-flow-read");
  const state = receipts[0].result;
  assert.deepEqual(state.cart, []);
  assert.equal(state.total, 0);
  assert.ok(state.lastOrder, "No order was stored.");
  assert.match(state.lastOrder.orderId, /^WM-[0-9A-F]{8}$/);
  assert.equal(state.lastOrder.status, "received");
  assert.equal(state.lastOrder.customerName, "Flow Visitor");
  assert.equal(state.lastOrder.fulfillment, "delivery");
  assert.equal(state.lastOrder.zone, "B");
  assert.equal(state.lastOrder.total, 62000);
  assert.equal(state.lastOrder.totalFormatted, "Rp62.000");
  assert.deepEqual(state.lastOrder.items, [
    {id: "nasi-goreng", name: "Nasi Goreng", quantity: 2, unitPrice: 25000, lineTotal: 50000},
  ]);
  // The page shows the confirmation, as the visitor would see it.
  assert.equal(document.getElementById("confirmation").hidden, false);
  assert.match(document.getElementById("order-summary").textContent, /Flow Visitor/);
  assert.match(document.getElementById("order-summary").textContent, /WM-[0-9A-F]{8}/);
  assert.equal(document.getElementById("order-total").textContent, "Total: Rp62.000");
  assert.equal(document.getElementById("cart-total").textContent, "Rp0");
});

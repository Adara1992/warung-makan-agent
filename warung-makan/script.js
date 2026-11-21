/**
 * Warung Makan's page: menu, cart and demo checkout.
 *
 * Prices are whole Indonesian rupiah (IDR). The cart lives in memory, so the page
 * needs no backend. The assistant's actions and its confirmation dialog use this
 * same page object, so they share the page's cart and rules.
 */
import { WarungData } from "./js/warung-data.js";

const form = document.querySelector("#checkout-form");
const fulfillment = document.querySelector("#fulfillment");
const zone = document.querySelector("#zone");
const address = document.querySelector("#address");

/**
 * Format whole rupiah the way the page shows it.
 *
 * :param amount: Whole IDR.
 * :return: Such as "Rp25.000".
 */
const money = (amount) => WarungData.formatIDR(amount);

/**
 * Create an element with text and a class.
 *
 * :param tag: The tag name.
 * :param text: The text content, or undefined.
 * :param className: The class, or undefined.
 * :return: The element.
 */
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.setAttribute("class", className);
  return node;
}

/**
 * Create a button with a label and a click handler.
 *
 * :param text: The button's text.
 * :param label: Its aria-label.
 * :param action: The click handler.
 * :return: The button.
 */
function button(text, label, action) {
  const node = element("button", text);
  node.type = "button";
  node.setAttribute("aria-label", label);
  node.addEventListener("click", action);
  return node;
}

/**
 * The warung's page: its data, its cart and its checkout.
 */
class WarungPage {
  /**
   * Create the page for a document.
   *
   * :param doc: The page's document.
   */
  constructor(doc) {
    this.doc = doc;
    this.cart = new Map();
    this.cartVersion = 0;
    this.lastOrder = null;
  }

  /**
   * Render the menu, the facts and the fee table, and wire the checkout form.
   */
  start() {
    this.renderFacts();
    this.renderMenu();
    this.renderCart();
    this.updateFulfillment();
    fulfillment.addEventListener("change", () => this.updateFulfillment());
    form.addEventListener("input", (event) => event.target.setCustomValidity(""));
    form.addEventListener("submit", (event) => this.placeOrder(event));
  }

  /**
   * Show the page facts and the delivery fee table from the data module.
   */
  renderFacts() {
    this.doc.querySelector("#hours-note").textContent = WarungData.FACTS.hours;
    this.doc.querySelector("#halal-note").textContent = WarungData.FACTS.halal;
    this.doc.querySelector("#delivery-note").textContent = WarungData.FACTS.delivery;
    const link = this.doc.querySelector("#ojek-link");
    link.textContent = WarungData.FACTS.partnerLink.label;
    link.setAttribute("href", WarungData.FACTS.partnerLink.href);
    const rows = this.doc.querySelector("#fee-rows");
    rows.replaceChildren();
    for (const entry of WarungData.DELIVERY_ZONES) {
      const row = element("tr");
      row.append(
        element("td", entry.name),
        element("td", money(entry.fee)),
        element("td", entry.window),
      );
      rows.append(row);
    }
  }

  /**
   * Render the menu from the data module.
   */
  renderMenu() {
    const list = this.doc.querySelector("#menu-items");
    for (const item of WarungData.MENU) {
      const article = element("article", undefined, "menu-item");
      const heading = element("div", undefined, "item-heading");
      heading.append(element("h3", item.name), element("strong", money(item.price)));
      const actions = element("div", undefined, "item-actions");
      actions.append(
        element("span", `${item.labels} · ${item.spice}`, "dietary"),
        button("Add to cart", `Add ${item.name} to cart`, () => this.changeQuantity(item.id, 1)),
      );
      article.append(
        heading,
        element("p", item.description),
        element("p", `Allergens: ${item.allergens}.`, "demo-note"),
        actions,
      );
      list.append(article);
    }
  }

  /**
   * The cart's items total in whole IDR.
   *
   * :return: The total.
   */
  cartTotal() {
    return WarungData.MENU.reduce(
      (total, item) => total + item.price * (this.cart.get(item.id) || 0),
      0,
    );
  }

  /**
   * Change one item's quantity from a page button.
   *
   * :param id: The menu id.
   * :param change: How many to add or remove.
   */
  changeQuantity(id, change) {
    const item = WarungData.findItem(id);
    if (!item) throw new Error("Unknown menu item");
    const quantity = Math.max(0, (this.cart.get(id) || 0) + change);
    this.cartVersion++;
    if (quantity) this.cart.set(id, quantity);
    else this.cart.delete(id);
    this.renderCart();
    this.doc.querySelector("#cart-status").textContent =
      `${item.name}: ${quantity} in cart. Total ${money(this.cartTotal())}.`;
  }

  /**
   * Rebuild the cart list and total from the cart.
   */
  renderCart() {
    const list = this.doc.querySelector("#cart-items");
    // Restore keyboard focus when the quantity controls are rebuilt.
    const focusedLabel = list.contains(this.doc.activeElement)
      ? this.doc.activeElement.getAttribute("aria-label") : null;
    list.replaceChildren();
    for (const [id, quantity] of this.cart) {
      const item = WarungData.findItem(id);
      const row = element("li");
      const line = element("div", undefined, "cart-line");
      line.append(element("strong", item.name), element("span", money(item.price * quantity)));
      const controls = element("div", undefined, "quantity-controls");
      const remove = button("Remove", `Remove ${item.name}`, () => this.changeQuantity(id, -quantity));
      remove.setAttribute("class", "remove");
      controls.append(
        button("−", `Decrease ${item.name} quantity`, () => this.changeQuantity(id, -1)),
        element("span", String(quantity)),
        button("+", `Increase ${item.name} quantity`, () => this.changeQuantity(id, 1)),
        remove,
      );
      row.append(line, controls);
      list.append(row);
    }
    this.doc.querySelector("#empty-cart").hidden = this.cart.size > 0;
    this.doc.querySelector("#cart-total").textContent = money(this.cartTotal());
    this.doc.querySelector("#place-order").disabled = this.cart.size === 0;
    if (focusedLabel) {
      const nextFocus = Array.from(list.querySelectorAll("button"))
        .find((node) => node.getAttribute("aria-label") === focusedLabel);
      (nextFocus || this.doc.querySelector("#customer-name")).focus();
    }
  }

  /**
   * Show or hide the delivery fields from the fulfillment choice.
   */
  updateFulfillment() {
    const delivery = fulfillment.value === "delivery";
    this.doc.querySelector("#delivery-fields").hidden = !delivery;
    address.disabled = !delivery;
    address.required = delivery;
    zone.disabled = !delivery;
    zone.required = delivery;
  }

  /**
   * Read the page's data and current state as plain JSON.
   *
   * :return: The menu, cart, total, version, latest order, delivery fees and facts.
   */
  getState() {
    return {
      menu: WarungData.MENU.map((item) => ({ ...item })),
      currency: "IDR",
      cart: Array.from(this.cart, ([id, quantity]) => ({ id, quantity })),
      total: this.cartTotal(),
      totalFormatted: money(this.cartTotal()),
      cartVersion: this.cartVersion,
      lastOrder: this.lastOrder ? { ...this.lastOrder } : null,
      deliveryZones: WarungData.DELIVERY_ZONES.map((entry) => ({
        ...entry,
        feeFormatted: money(entry.fee),
      })),
      hours: WarungData.FACTS.hours,
      pageFacts: {
        halal: WarungData.FACTS.halal,
        delivery: WarungData.FACTS.delivery,
        demo: WarungData.FACTS.demo,
        partnerLink: { ...WarungData.FACTS.partnerLink },
      },
      simulated: true,
    };
  }

  /**
   * List the menu ids, for the add-to-cart schema.
   *
   * :return: The ids.
   */
  catalogIds() {
    return WarungData.MENU.map((item) => item.id);
  }

  /**
   * Add a quantity of one dish to the shared cart.
   *
   * :param id: The menu id.
   * :param quantity: How many to add.
   * :return: The updated state, or {ok: false, reason} when refused.
   */
  addItem(id, quantity) {
    const item = WarungData.findItem(id);
    if (!item) {
      return { ok: false, reason: "That dish is not on the menu." };
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return { ok: false, reason: "Use a quantity from 1 to 100." };
    }
    const existing = this.cart.get(id) || 0;
    this.cart.set(id, existing + quantity);
    this.cartVersion++;
    this.renderCart();
    this.doc.querySelector("#cart-status").textContent =
      `${item.name}: ${this.cart.get(id)} in cart. Total ${money(this.cartTotal())}.`;
    return this.getState();
  }

  /**
   * Replace the shared cart with a full list. Validates every line first, so a
   * refused replacement changes nothing.
   *
   * :param items: The desired [{id, quantity}] list.
   * :return: The updated state, or {ok: false, reason} when refused.
   */
  setCart(items) {
    if (!Array.isArray(items) || items.length > WarungData.MENU.length) {
      return { ok: false, reason: "Invalid cart." };
    }
    const ids = new Set();
    for (const { id, quantity } of items) {
      if (!WarungData.findItem(id) || ids.has(id)
        || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        return { ok: false, reason: "Use unique menu IDs and quantities from 1 to 100." };
      }
      ids.add(id);
    }
    this.cart.clear();
    for (const { id, quantity } of items) this.cart.set(id, quantity);
    this.cartVersion++;
    this.renderCart();
    this.doc.querySelector("#cart-status").textContent =
      `Cart updated. Total ${money(this.cartTotal())}.`;
    return this.getState();
  }

  /**
   * Check a demo order without changing anything. The confirmation dialog and the
   * order operation both call this first.
   *
   * :param args: The order arguments.
   * :return: {ok: true, order} or {ok: false, reason, field}.
   */
  checkOrder(args) {
    if (!this.cart.size) {
      return { ok: false, reason: "Your cart is empty.", field: "cart" };
    }
    if (args.expectedCartVersion !== this.cartVersion) {
      return {
        ok: false,
        reason: "Your cart changed. Review it again before ordering.",
        field: "cart",
      };
    }
    if (typeof args.customerName !== "string" || !args.customerName.trim()
      || args.customerName.length > 80) {
      return {
        ok: false,
        reason: "Please enter your name (up to 80 characters).",
        field: "customerName",
      };
    }
    if (!["pickup", "delivery"].includes(args.fulfillment)) {
      return { ok: false, reason: "Choose pickup or delivery.", field: "fulfillment" };
    }
    let deliveryFee = 0;
    let zoneName = "";
    if (args.fulfillment === "delivery") {
      if (typeof args.address !== "string" || args.address.length > 300
        || !args.address.trim()) {
        return { ok: false, reason: "Please enter a delivery address.", field: "address" };
      }
      const fee = WarungData.feeForZone(args.zone);
      if (!fee.ok) {
        return { ok: false, reason: fee.reason, field: "zone" };
      }
      deliveryFee = fee.fee;
      zoneName = fee.name;
    }
    if (typeof args.orderTime !== "string"
      || (args.orderTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(args.orderTime))) {
      return {
        ok: false,
        reason: "Use HH:MM for today's requested time, or leave it blank for ASAP.",
        field: "orderTime",
      };
    }
    const items = Array.from(this.cart, ([id, quantity]) => {
      const item = WarungData.findItem(id);
      return {
        id,
        name: item.name,
        quantity,
        unitPrice: item.price,
        lineTotal: item.price * quantity,
      };
    });
    const itemsTotal = this.cartTotal();
    return {
      ok: true,
      order: {
        customerName: args.customerName.trim(),
        fulfillment: args.fulfillment,
        zone: args.fulfillment === "delivery" ? args.zone : "",
        zoneName,
        address: args.fulfillment === "delivery" ? args.address.trim() : "",
        orderTime: args.orderTime || "",
        items,
        itemsTotal,
        itemsTotalFormatted: money(itemsTotal),
        deliveryFee,
        deliveryFeeFormatted: money(deliveryFee),
        total: itemsTotal + deliveryFee,
        totalFormatted: money(itemsTotal + deliveryFee),
        currency: "IDR",
      },
    };
  }

  /**
   * Place a simulated order for the current cart. No payment or real fulfillment.
   * Shows the confirmation where the page's own form would, and clears the cart.
   * Moves no focus and resets no form: the page's own handler does that.
   *
   * :param args: The order arguments.
   * :return: The demo receipt, or {ok: false, reason, field} when refused.
   */
  submitOrder(args) {
    const check = this.checkOrder(args);
    if (!check.ok) return check;
    const order = check.order;
    this.lastOrder = {
      orderId: `WM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: "received",
      simulated: true,
      ...order,
    };
    const when = order.orderTime || "as soon as possible";
    const destination = order.fulfillment === "delivery"
      ? `Delivery to ${order.address} (${order.zoneName})` : "Pickup at Warung Makan";
    this.doc.querySelector("#order-summary").textContent =
      `${this.lastOrder.customerName}, your order ${this.lastOrder.orderId} is received. ${destination}, ${when}.`;
    const items = order.items.map((item) =>
      element("li", `${item.quantity} × ${item.name} — ${money(item.lineTotal)}`));
    this.doc.querySelector("#order-items").replaceChildren(...items);
    this.doc.querySelector("#order-total").textContent = `Total: ${money(order.total)}`;
    this.cart.clear();
    this.cartVersion++;
    this.renderCart();
    this.doc.querySelector("#checkout-error").textContent = "";
    this.doc.querySelector("#confirmation").hidden = false;
    return { ok: true, ...this.lastOrder };
  }

  /**
   * Handle the page's own checkout form: same operation, then reset the form and
   * move focus to the confirmation.
   *
   * :param event: The submit event.
   */
  placeOrder(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const result = this.submitOrder({
      customerName: form.elements.customerName.value,
      fulfillment: fulfillment.value,
      zone: zone.value,
      address: address.value,
      orderTime: form.elements.orderTime.value,
      expectedCartVersion: this.cartVersion,
    });
    if (!result.ok) {
      this.doc.querySelector("#checkout-error").textContent = result.reason;
      const field = {
        customerName: form.elements.customerName,
        address,
        zone,
        orderTime: form.elements.orderTime,
      }[result.field];
      if (field) field.setCustomValidity(result.reason);
      return;
    }
    this.doc.querySelector("#checkout-error").textContent = "";
    form.reset();
    this.updateFulfillment();
    this.doc.querySelector("#confirmation").focus();
  }
}

/**
 * Starts the warung page. index.html loads this module.
 *
 * App.page is the running page. The assistant's actions and its confirmation
 * dialog use it too, so they share the page's cart and forms.
 */
export class App {
  /** The running warung page, set when this module loads. */
  static page = null;

  /**
   * Create the page and connect it to the document.
   *
   * :param doc: The page's document.
   * :return: The running page.
   */
  static start(doc) {
    const page = new WarungPage(doc);
    page.start();
    return page;
  }
}

App.page = App.start(document);

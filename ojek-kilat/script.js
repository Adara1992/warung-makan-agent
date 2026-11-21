/**
 * Ojek Kilat's page: delivery zones, fees and time windows.
 *
 * Prices are whole Indonesian rupiah (IDR). The page is read-only: it quotes
 * delivery, and never takes a booking. The assistant's actions use this same page
 * object, so they share the page's zones and rules.
 */
import { OjekData } from "./js/ojek-data.js";

/**
 * Format whole rupiah the way the page shows it.
 *
 * :param amount: Whole IDR.
 * :return: Such as "Rp12.000".
 */
const money = (amount) => OjekData.formatIDR(amount);

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
 * The courier's page: its data and its quote.
 */
class OjekPage {
  /**
   * Create the page for a document.
   *
   * :param doc: The page's document.
   */
  constructor(doc) {
    this.doc = doc;
  }

  /**
   * Render the facts and the fee table.
   */
  start() {
    this.renderFacts();
    this.renderZones();
  }

  /**
   * Show the page facts from the data module.
   */
  renderFacts() {
    this.doc.querySelector("#hours-note").textContent = OjekData.FACTS.hours;
    this.doc.querySelector("#service-note").textContent = OjekData.FACTS.service;
    const link = this.doc.querySelector("#warung-link");
    link.textContent = OjekData.FACTS.partnerLink.label;
    link.setAttribute("href", OjekData.FACTS.partnerLink.href);
  }

  /**
   * Render the delivery zones and fees from the data module.
   */
  renderZones() {
    const rows = this.doc.querySelector("#fee-rows");
    rows.replaceChildren();
    for (const entry of OjekData.ZONES) {
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
   * Read the page's data and current state as plain JSON.
   *
   * :return: The zones, fees, hours and facts.
   */
  getState() {
    return {
      zones: OjekData.ZONES.map((entry) => ({
        ...entry,
        feeFormatted: money(entry.fee),
      })),
      currency: "IDR",
      hours: OjekData.FACTS.hours,
      pageFacts: {
        service: OjekData.FACTS.service,
        demo: OjekData.FACTS.demo,
        partnerLink: { ...OjekData.FACTS.partnerLink },
      },
      simulated: true,
    };
  }

  /**
   * Quote delivery for one zone, without changing anything.
   *
   * :param zone: "A", "B" or "C".
   * :return: The quote, or {ok: false, reason} when unknown.
   */
  quoteDelivery(zone) {
    return OjekData.feeForZone(zone);
  }
}

/**
 * Starts the courier page. index.html loads this module.
 *
 * App.page is the running page. The assistant's actions use it too, so they share
 * the page's zones and rules.
 */
export class App {
  /** The running courier page, set when this module loads. */
  static page = null;

  /**
   * Create the page and connect it to the document.
   *
   * :param doc: The page's document.
   * :return: The running page.
   */
  static start(doc) {
    const page = new OjekPage(doc);
    page.start();
    return page;
  }
}

App.page = App.start(document);

/**
 * Ojek Kilat's data: delivery zones, fees and page facts.
 *
 * This module touches no DOM, so the page, the actions and the action bridge can all
 * import it. Prices are whole Indonesian rupiah (IDR). Keep the zones in sync with
 * warung-makan/js/warung-data.js: the warung charges exactly these fees, and a test
 * checks the two tables match.
 */
export class OjekData {
  /**
   * Delivery zones and fees. The warung charges exactly these fees for delivery.
   * Keep in sync with warung-makan/js/warung-data.js.
   */
  static ZONES = [
    { zone: "A", name: "Zone A — Central (0–3 km)", fee: 8000, window: "20–30 minutes" },
    { zone: "B", name: "Zone B — Nearby (3–6 km)", fee: 12000, window: "30–45 minutes" },
    { zone: "C", name: "Zone C — Outer (6–10 km)", fee: 18000, window: "45–60 minutes" },
  ];

  /** The farthest zone the courier serves. */
  static MAX_DELIVERY_KM = 10;

  /** Facts the page shows and the read action returns. */
  static FACTS = {
    hours: "Open daily 07:00–21:00.",
    service: "Delivery by motorbike courier, Zones A–C (up to 10 km). Quotes only: no bookings, no real-time tracking.",
    demo: "Demo site — quotes are simulated, with no payment or real delivery.",
    partnerLink: {
      label: "Warung Makan",
      // Live address on GitHub Pages.
      href: "https://adara1992.github.io/warung-makan-agent/warung-makan/",
    },
  };

  /**
   * Format whole rupiah the way the page shows it.
   *
   * :param amount: Whole IDR.
   * :return: Such as "Rp12.000".
   */
  static formatIDR(amount) {
    return `Rp${new Intl.NumberFormat("id-ID").format(amount)}`;
  }

  /**
   * Look up one zone's delivery fee and time window.
   *
   * :param zone: "A", "B" or "C".
   * :return: The quote, or {ok: false, reason} when unknown.
   */
  static feeForZone(zone) {
    const found = OjekData.ZONES.find((entry) => entry.zone === zone);
    if (!found) {
      return {
        ok: false,
        reason: `We deliver only to Zones A, B and C (up to ${OjekData.MAX_DELIVERY_KM} km).`,
      };
    }
    return {
      ok: true,
      zone: found.zone,
      zoneName: found.name,
      fee: found.fee,
      feeFormatted: OjekData.formatIDR(found.fee),
      window: found.window,
      deliverable: true,
    };
  }
}

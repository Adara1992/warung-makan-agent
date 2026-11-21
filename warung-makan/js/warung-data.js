/**
 * Warung Makan's data: menu, delivery fees and page facts.
 *
 * This module touches no DOM, so the page, the actions and the action bridge can all
 * import it. Prices are whole Indonesian rupiah (IDR). Keep the delivery fee table in
 * sync with ojek-kilat/js/ojek-data.js: the warung charges the courier's published
 * fees, and a test checks the two tables match.
 */
export class WarungData {
  /** The menu. Prices are whole IDR. */
  static MENU = [
    {
      id: "nasi-goreng",
      name: "Nasi Goreng",
      price: 25000,
      description: "Fried rice with egg, shredded chicken, shallots and sweet soy sauce",
      labels: "Halal",
      spice: "Medium",
      allergens: "Egg, soy, wheat",
    },
    {
      id: "soto-ayam",
      name: "Soto Ayam",
      price: 22000,
      description: "Turmeric chicken soup with rice noodles, boiled egg, bean sprouts and lime",
      labels: "Halal",
      spice: "Mild",
      allergens: "Egg",
    },
    {
      id: "gado-gado",
      name: "Gado-Gado",
      price: 20000,
      description: "Steamed vegetables, tofu, tempeh and boiled egg with peanut sauce",
      labels: "Halal · Vegetarian",
      spice: "Mild",
      allergens: "Peanut, egg, soy",
    },
    {
      id: "sate-ayam",
      name: "Sate Ayam",
      price: 28000,
      description: "Grilled chicken skewers with peanut sauce and lontong rice cakes",
      labels: "Halal",
      spice: "Medium",
      allergens: "Peanut, soy",
    },
    {
      id: "mie-goreng",
      name: "Mie Goreng",
      price: 23000,
      description: "Fried noodles with chicken, cabbage, carrot and egg",
      labels: "Halal",
      spice: "Medium",
      allergens: "Egg, soy, wheat",
    },
    {
      id: "ayam-geprek",
      name: "Ayam Geprek",
      price: 26000,
      description: "Smashed fried chicken with sambal and steamed rice",
      labels: "Halal",
      spice: "Hot",
      allergens: "None listed",
    },
    {
      id: "es-teh",
      name: "Es Teh Manis",
      price: 6000,
      description: "Sweet iced tea",
      labels: "Halal · Vegetarian",
      spice: "None",
      allergens: "None",
    },
    {
      id: "es-jeruk",
      name: "Es Jeruk",
      price: 8000,
      description: "Fresh orange juice with ice",
      labels: "Halal · Vegetarian",
      spice: "None",
      allergens: "None",
    },
  ];

  /**
   * Delivery zones and fees, as published by Ojek Kilat. The warung charges exactly
   * these fees for delivery; pickup is free. Keep in sync with
   * ojek-kilat/js/ojek-data.js.
   */
  static DELIVERY_ZONES = [
    { zone: "A", name: "Zone A — Central (0–3 km)", fee: 8000, window: "20–30 minutes" },
    { zone: "B", name: "Zone B — Nearby (3–6 km)", fee: 12000, window: "30–45 minutes" },
    { zone: "C", name: "Zone C — Outer (6–10 km)", fee: 18000, window: "45–60 minutes" },
  ];

  /** The farthest zone the courier serves. */
  static MAX_DELIVERY_KM = 10;

  /** Facts the page shows and the read action returns. */
  static FACTS = {
    hours: "Open daily 07:00–21:00.",
    halal: "Every dish is halal.",
    delivery:
      "Delivery by Ojek Kilat motorbike courier, Zones A–C (up to 10 km). Pickup is free.",
    demo: "Demo site — orders are simulated, with no payment or real fulfillment.",
    partnerLink: {
      label: "Ojek Kilat",
      // Live address on GitHub Pages.
      href: "https://adara1992.github.io/warung-makan-agent/ojek-kilat/",
    },
  };

  /**
   * Format whole rupiah the way the page shows it.
   *
   * :param amount: Whole IDR.
   * :return: Such as "Rp25.000".
   */
  static formatIDR(amount) {
    return `Rp${new Intl.NumberFormat("id-ID").format(amount)}`;
  }

  /**
   * Look up one zone's delivery fee and time window.
   *
   * :param zone: "A", "B" or "C".
   * :return: The zone with its fee and window, or {ok: false, reason} when unknown.
   */
  static feeForZone(zone) {
    const found = WarungData.DELIVERY_ZONES.find((entry) => entry.zone === zone);
    if (!found) {
      return {
        ok: false,
        reason: `We deliver only to Zones A, B and C (up to ${WarungData.MAX_DELIVERY_KM} km).`,
      };
    }
    return { ok: true, ...found, feeFormatted: WarungData.formatIDR(found.fee) };
  }

  /**
   * Find one menu item by id.
   *
   * :param id: The menu id.
   * :return: The item, or undefined.
   */
  static findItem(id) {
    return WarungData.MENU.find((item) => item.id === id);
  }
}

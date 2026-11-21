// The read action this site shares with other agent sites, through its action bridge.
// bridge/agent-manifest.json loads this module in the bridge frame, which has no page.
// So it reads the warung's data module, which holds the menu, the delivery fees and the
// page's facts. Each action has the name the page's own action has (site-actions.js), so
// the network's instructions fit both. The cart is never shared: it lives on the page.
import { WarungData } from "../js/warung-data.js";

/**
 * Shares the warung's public read with the partner sites that call this site's network.
 *
 * A partner's agent calls it from the partner's page, and each call runs here, in a
 * hidden frame on this site's origin. The read shows only public facts the page already
 * shows, so every site may call it.
 */
class BridgeActions {
  /** The sites allowed to call this read. The menu and fees are public, so "*". */
  static CALLERS = ["*"];

  /**
   * Register the shared read with the bridge's registry.
   *
   * :param actions: The runtime registry facade with a register(definition) method.
   */
  static registerActions(actions) {
    actions.register(BridgeActions.readStateAction());
  }

  /**
   * Describe the shared read of the menu, the delivery fees and the page's facts.
   *
   * :return: The action definition.
   */
  static readStateAction() {
    return {
      name: "get_warung_state",
      description: "Read the warung's menu (dishes, whole IDR prices, halal and vegetarian labels, spice levels, allergens), the delivery zones with fees and time windows, the opening hours and the page's facts. It does not show the visitor's cart. Changes nothing. Call it before answering about the menu or delivery.",
      effect: "read",
      availability: "bridge",
      callerOrigins: BridgeActions.CALLERS,
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      execute: BridgeActions.readState,
    };
  }

  /**
   * Read the warung's data, as the page's get_warung_state returns it, without the cart.
   *
   * :return: The menu, delivery zones, hours and page facts.
   */
  static readState() {
    return {
      menu: WarungData.MENU.map((item) => ({ ...item })),
      currency: "IDR",
      deliveryZones: WarungData.DELIVERY_ZONES.map((entry) => ({
        ...entry,
        feeFormatted: WarungData.formatIDR(entry.fee),
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
}

// The bridge calls the module's registerActions export.
export const registerActions = BridgeActions.registerActions;

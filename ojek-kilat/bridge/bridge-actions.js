// The read actions this site shares with other agent sites, through its action bridge.
// bridge/agent-manifest.json loads this module in the bridge frame, which has no page.
// So it reads the courier's data module, which holds the zones, the fees and the page's
// facts. Each action has the name the page's own action has (site-actions.js), so the
// network's instructions fit both. Nothing here can see the page.
import { OjekData } from "../js/ojek-data.js";

/**
 * Shares the courier's reads with the partner sites that call this site's network.
 *
 * A partner's agent calls them from the partner's page, and each call runs here, in a
 * hidden frame on this site's origin. Only Warung Makan calls this site, so only its
 * origin is listed.
 */
class BridgeActions {
  /** The sites allowed to call these reads, as exact origins with the port. */
  static CALLERS = [
    "https://adara1992.github.io",
  ];

  /**
   * Register the shared reads with the bridge's registry.
   *
   * :param actions: The runtime registry facade with a register(definition) method.
   */
  static registerActions(actions) {
    actions.register(BridgeActions.readStateAction());
    actions.register(BridgeActions.quoteDeliveryAction());
  }

  /**
   * Describe the shared read of the zones, the fees and the page's facts.
   *
   * :return: The action definition.
   */
  static readStateAction() {
    return {
      name: "get_ojek_state",
      description: "Read Ojek Kilat's delivery zones with fees and time windows, the service hours and the page's facts. It does not take a booking. Changes nothing. Call it before answering about delivery zones, fees or times.",
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
   * Read the courier's data, as the page's get_ojek_state returns it.
   *
   * :return: The zones, fees, hours and page facts.
   */
  static readState() {
    return {
      zones: OjekData.ZONES.map((entry) => ({
        ...entry,
        feeFormatted: OjekData.formatIDR(entry.fee),
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
   * Describe the shared read that quotes delivery for one zone.
   *
   * :return: The action definition.
   */
  static quoteDeliveryAction() {
    return {
      name: "quote_delivery",
      description: "Quote delivery for one zone: its fee in whole IDR and its time window. Changes nothing. Returns ok false with a reason when the zone is not served.",
      effect: "read",
      availability: "bridge",
      callerOrigins: BridgeActions.CALLERS,
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["zone"],
        properties: {
          zone: {
            type: "string",
            enum: ["A", "B", "C"],
            description: "The delivery zone from get_ojek_state.",
          },
        },
      },
      execute: BridgeActions.quoteDelivery,
    };
  }

  /**
   * Quote delivery through the courier's own quote function.
   *
   * :param args: The validated arguments with zone.
   * :return: The quote, or {ok: false, reason} when the zone is not served.
   */
  static quoteDelivery(args) {
    return OjekData.feeForZone(args.zone);
  }
}

// The bridge calls the module's registerActions export.
export const registerActions = BridgeActions.registerActions;

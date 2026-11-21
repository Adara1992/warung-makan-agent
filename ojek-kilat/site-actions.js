// Registers this website's operations with the agent runtime.
// agent-manifest.json loads this module through "actions.module". Only the names in
// "actions.agentTools" become model tools, called website_<name>.
//
// The page script is imported by the same URL the page uses (no ?v= query), or the
// actions get a second, separate copy of the page state. Operations return
// {ok: false, reason} when they refuse input, before changing anything, and throw only
// on unexpected failures. A throw is reported as "unknown".
import { App } from "./script.js";

/**
 * Describes the site's operations as actions the agents can call.
 *
 * Both actions are reads: this site quotes delivery and never takes a booking, so it
 * has no write or irreversible action. The runtime validates arguments against
 * inputSchema before execute runs.
 */
class SiteActions {
  /**
   * Register every site action with the runtime.
   *
   * :param actions: The runtime registry facade with a register(definition) method.
   */
  static registerActions(actions) {
    actions.register(SiteActions.readStateAction());
    actions.register(SiteActions.quoteDeliveryAction());
  }

  /**
   * Describe the read action that returns the page's data and current state.
   *
   * :return: The action definition.
   */
  static readStateAction() {
    return {
      name: "get_ojek_state",
      // The model reads each description to choose a tool. Say when to call it and what
      // to call before it here, not in the agent's instructions.
      description: "Read Ojek Kilat's delivery zones with fees and time windows, the service hours and the page's facts. Call it before answering about delivery zones, fees or times. Changes nothing.",
      effect: "read",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      execute: SiteActions.readState,
    };
  }

  /**
   * Return a fresh copy of the page state.
   *
   * :return: The page state as plain JSON data.
   */
  static readState() {
    return App.page.getState();
  }

  /**
   * Describe the read that quotes delivery for one zone.
   *
   * :return: The action definition.
   */
  static quoteDeliveryAction() {
    return {
      name: "quote_delivery",
      description: "Quote delivery for one zone: its fee in whole IDR and its time window. Call it after website_get_ojek_state, with the zone the visitor asked about. Changes nothing. Returns ok false with a reason when the zone is not served.",
      effect: "read",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["zone"],
        properties: {
          zone: {
            type: "string",
            enum: ["A", "B", "C"],
            description: "The delivery zone from website_get_ojek_state.",
          },
        },
      },
      execute: SiteActions.quoteDelivery,
    };
  }

  /**
   * Quote delivery through the site's own quote function.
   *
   * :param args: The validated arguments with zone.
   * :return: The quote, or {ok: false, reason} when the zone is not served.
   */
  static quoteDelivery(args) {
    return App.page.quoteDelivery(args.zone);
  }
}

// The runtime calls the module's registerActions export.
export const registerActions = SiteActions.registerActions;

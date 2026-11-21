// Registers this website's operations with the agent runtime.
// agent-manifest.json loads this module through "actions.module". Only the names in
// "actions.agentTools" become model tools, called website_<name>.
//
// The page script is imported by the same URL the page uses (no ?v= query), or the
// actions get a second, separate copy of the page state. Operations return
// {ok: false, reason, field} when they refuse input, before changing anything, and
// throw only on unexpected failures. A throw is reported as "unknown".
import { App } from "./script.js";
import { WarungData } from "./js/warung-data.js";

/**
 * Describes the site's operations as actions the agents can call.
 *
 * Each action wraps a function the page already uses, so the assistant and the manual
 * UI share one set of rules. The runtime validates arguments against inputSchema before
 * execute runs, and asks the visitor to confirm "irreversible" actions first.
 */
class SiteActions {
  /**
   * Register every site action with the runtime.
   *
   * :param actions: The runtime registry facade with a register(definition) method.
   */
  static registerActions(actions) {
    actions.register(SiteActions.readStateAction());
    actions.register(SiteActions.addItemAction());
    actions.register(SiteActions.setCartAction());
    actions.register(SiteActions.submitOrderAction());
  }

  /**
   * Describe the read action that returns the page's data and current state.
   *
   * :return: The action definition.
   */
  static readStateAction() {
    return {
      name: "get_warung_state",
      // The model reads each description to choose a tool. Say when to call it and what
      // to call before it here, not in the agent's instructions.
      description: "Read the warung's menu (dishes, whole IDR prices, halal and vegetarian labels, spice levels, allergens), the cart and its total and version, the delivery fees and time windows, and the latest demo order. Call it before answering about the menu or the cart, and again in each turn that needs it: the visitor can also use the page.",
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
   * Describe a reversible write the agent may run without a confirmation dialog.
   *
   * :return: The action definition.
   */
  static addItemAction() {
    return {
      name: "add_to_cart",
      description: "Add a dish to the visitor's cart. Use only when the visitor asks for it, with an id from website_get_warung_state. Returns the updated state with the new version, or ok false with a reason. Does not place an order.",
      // "write" runs immediately. Use it only for changes the visitor can undo on the page.
      effect: "write",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["id", "quantity"],
        properties: {
          // An enum of real IDs stops the model from inventing items.
          id: {
            type: "string",
            enum: App.page.catalogIds(),
            description: "The dish's menu ID from website_get_warung_state.",
          },
          quantity: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "How many to add.",
          },
        },
      },
      execute: SiteActions.addItem,
    };
  }

  /**
   * Add a dish through the site's own cart function.
   *
   * :param args: The validated arguments with id and quantity.
   * :return: The updated page state, or {ok: false, reason} when refused.
   */
  static addItem(args) {
    return App.page.addItem(args.id, args.quantity);
  }

  /**
   * Describe the write that replaces the whole cart.
   *
   * :return: The action definition.
   */
  static setCartAction() {
    return {
      name: "set_cart",
      description: "Replace the visitor's cart with a full list. Use only when the visitor asks for it, with ids from website_get_warung_state. Validates every line first, so a refused replacement changes nothing. Returns the updated state with the new version, or ok false with a reason. Does not place an order.",
      effect: "write",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["items"],
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "quantity"],
              properties: {
                id: {
                  type: "string",
                  enum: App.page.catalogIds(),
                  description: "The dish's menu ID from website_get_warung_state.",
                },
                quantity: {
                  type: "integer",
                  minimum: 1,
                  maximum: 100,
                  description: "How many.",
                },
              },
            },
            description: "The cart's full contents, in order.",
          },
        },
      },
      execute: SiteActions.setCart,
    };
  }

  /**
   * Replace the cart through the site's own cart function.
   *
   * :param args: The validated arguments with items.
   * :return: The updated page state, or {ok: false, reason} when refused.
   */
  static setCart(args) {
    return App.page.setCart(args.items);
  }

  /**
   * Describe the irreversible operation that the visitor must confirm.
   *
   * :return: The action definition.
   */
  static submitOrderAction() {
    return {
      name: "checkout_demo_order",
      description: "Place a demo order for the visitor's cart. Demo only: no payment or real fulfillment. First ask for the name, pickup or delivery, and for delivery the zone and address. In the turn you call it, first call website_get_warung_state again and wait for its result: this needs its current cart version, and results from earlier turns are not kept. The browser asks the visitor to confirm. The site refuses a stale expectedCartVersion. Returns the demo receipt.",
      // "irreversible" makes the runtime open a confirmation dialog before execute runs.
      effect: "irreversible",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["customerName", "fulfillment", "expectedCartVersion"],
        properties: {
          customerName: {
            type: "string",
            minLength: 1,
            maxLength: 80,
            description: "The customer's name.",
          },
          fulfillment: {
            type: "string",
            enum: ["pickup", "delivery"],
            description: "Pickup at the warung, or delivery by Ojek Kilat.",
          },
          zone: {
            type: "string",
            enum: ["A", "B", "C"],
            description: "The delivery zone. Required for delivery, ignored for pickup.",
          },
          address: {
            type: "string",
            minLength: 1,
            maxLength: 300,
            description: "The delivery address. Required for delivery, ignored for pickup.",
          },
          orderTime: {
            type: "string",
            description: "Today's requested time in HH:MM, or blank for ASAP.",
          },
          expectedCartVersion: {
            type: "integer",
            minimum: 0,
            description: "The latest cart version in this turn: from website_get_warung_state, or from a cart change made after that read.",
          },
        },
      },
      execute: SiteActions.submitOrder,
    };
  }

  /**
   * Submit through the same function the page's own form uses.
   *
   * :param args: The validated, visitor-confirmed arguments.
   * :return: The demo receipt, or {ok: false, reason} when the site refuses the order.
   * :raises Error: Only on an unexpected failure; the runtime then reports "unknown".
   */
  static submitOrder(args) {
    return App.page.submitOrder(args);
  }
}

// The runtime calls the module's registerActions export.
export const registerActions = SiteActions.registerActions;

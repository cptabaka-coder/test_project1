import type { ShopOffer } from "../sim/shop";

/**
 * The minimal between-Wave Shop screen (design spec §9): the 4 offers,
 * click-to-buy, and Continue to the next Wave. Reroll/Lock/Sell aren't
 * wired to UI yet (issue #13's acceptance criterion only needs a full Run
 * to be playable, which just requires a way to spend and move on) — the
 * sim-side functions from issue #10 are ready for a later pass. Plain
 * DOM/CSS, verified by running the game.
 */
export interface ShopOverlay {
  update: (
    isShop: boolean,
    offers: (ShopOffer | undefined)[],
    carrots: number,
    onBuy: (offerIndex: number) => void,
    onContinue: () => void,
  ) => void;
}

function offerLabel(offer: ShopOffer): string {
  const name = offer.kind === "weapon" ? `${offer.weapon.id} Lv${offer.level}` : offer.item.label;
  return `${name} — ${offer.price.toFixed(0)}`;
}

export function createShopOverlay(host: HTMLElement): ShopOverlay {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;flex-direction:column;align-items:center;justify-content:center;gap:12px;" +
    "background:rgba(11,11,15,0.9);display:none;";
  host.appendChild(overlay);

  const title = document.createElement("div");
  title.textContent = "SHOP";
  title.style.cssText =
    "font:bold 28px ui-monospace,monospace;color:#e6e6f0;letter-spacing:0.1em;";
  overlay.appendChild(title);

  const carrotsLabel = document.createElement("div");
  carrotsLabel.style.cssText = "font:14px ui-monospace,monospace;color:#8b8fa8;";
  overlay.appendChild(carrotsLabel);

  const offersRow = document.createElement("div");
  offersRow.style.cssText = "display:flex;gap:10px;";
  overlay.appendChild(offersRow);

  const continueButton = document.createElement("button");
  continueButton.textContent = "Continue";
  continueButton.style.cssText =
    "font:18px ui-monospace,monospace;padding:10px 24px;margin-top:8px;" +
    "background:#1b1d2b;color:#e6e6f0;border:1px solid #3a3f5c;cursor:pointer;";
  overlay.appendChild(continueButton);

  let onContinueRef: (() => void) | undefined;
  continueButton.addEventListener("click", () => onContinueRef?.());

  let shownOffers: (ShopOffer | undefined)[] | undefined;
  let onBuyRef: ((offerIndex: number) => void) | undefined;

  return {
    update(isShop, offers, carrots, onBuy, onContinue): void {
      onContinueRef = onContinue;
      onBuyRef = onBuy;

      if (!isShop) {
        overlay.style.display = "none";
        shownOffers = undefined;
        return;
      }

      carrotsLabel.textContent = `${carrots.toFixed(0)} Carrots`;

      if (shownOffers !== offers) {
        shownOffers = offers;
        offersRow.querySelectorAll("button").forEach((button) => button.remove());
        offers.forEach((offer, index) => {
          if (!offer) return;
          const button = document.createElement("button");
          button.textContent = offerLabel(offer);
          button.style.cssText =
            "font:13px ui-monospace,monospace;padding:8px 12px;" +
            "background:#1b1d2b;color:#e6e6f0;border:1px solid #3a3f5c;cursor:pointer;";
          button.addEventListener("click", () => onBuyRef?.(index));
          offersRow.appendChild(button);
        });
      }

      overlay.style.display = "flex";
    },
  };
}

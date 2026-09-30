import type { FlightOffer } from "@shared/schema";

const BOOKING_OFFER_KEY = "h2h_booking_offer";

export function saveOfferForBooking(offer: FlightOffer) {
  try {
    sessionStorage.setItem(BOOKING_OFFER_KEY, JSON.stringify(offer));
    sessionStorage.removeItem("h2h_locked_price");
  } catch {}
}

export function loadOfferForBooking(): FlightOffer | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_OFFER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

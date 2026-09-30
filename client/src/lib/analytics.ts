declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    clarity: (...args: any[]) => void;
  }
}

export function initAnalytics() {
  const ga4Id = import.meta.env.VITE_GA4_ID as string | undefined;
  if (ga4Id) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ga4Id, { anonymize_ip: true, send_page_view: true });
  }

  const clarityId = import.meta.env.VITE_CLARITY_ID as string | undefined;
  if (clarityId) {
    (function (c: any, l: Document, a: string, r: string, i: string) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      const t = l.createElement(r) as HTMLScriptElement;
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0];
      y.parentNode?.insertBefore(t, y);
    })(window, document, "clarity", "script", clarityId);
  }
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params ?? {});
  }
}

export function trackSecureHorizonClick(origin: string, destination: string, price: number, currency: string) {
  trackEvent("secure_horizon_click", {
    flight_origin: origin,
    flight_destination: destination,
    price_value: price,
    currency,
  });
}

export function trackHorizonTipDisplay(tipType: "sweep" | "component", savings?: number) {
  trackEvent("horizon_tip_display", { tip_type: tipType, savings_amount: savings ?? 0 });
}

export function trackPaymentFailure(errorCode: string) {
  trackEvent("payment_failure", { error_code: errorCode });
}

export function trackPaymentSuccess(origin: string, destination: string) {
  trackEvent("payment_success", {
    flight_origin: origin,
    flight_destination: destination,
  });
}

const AVIASALES_FALLBACK = "https://tpk.mx/gCtH7LX7";

export async function safePartnerOpen(
  url: string,
  fallbackUrl: string = AVIASALES_FALLBACK,
): Promise<void> {
  if (url.startsWith("/go/")) {
    try {
      const resp = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(3000),
      });
      if (resp.status >= 300 && resp.status < 400) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        console.warn("[verify-status] /go/ route did not redirect, using fallback:", url);
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      console.warn("[verify-status] /go/ route unreachable, using fallback:", url);
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    }
    return;
  }

  try {
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      signal: AbortSignal.timeout(3000),
    });
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    console.warn("[verify-status] Partner link unreachable, using fallback:", url);
    window.open(fallbackUrl, "_blank", "noopener,noreferrer");
  }
}

export function openPartnerLink(url: string): void {
  if (url.startsWith("/go/")) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.open(AVIASALES_FALLBACK, "_blank", "noopener,noreferrer");
  }
}

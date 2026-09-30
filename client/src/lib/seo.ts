const SITE_NAME = "Himal to Horizon";
const BASE_URL = "https://himaltohorizon.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/favicon.png`;

function setMeta(selector: string, attr: string, value: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    if (selector.includes("property=")) {
      const prop = selector.match(/property="([^"]+)"/)?.[1];
      if (prop) el.setAttribute("property", prop);
    } else if (selector.includes("name=")) {
      const name = selector.match(/name="([^"]+)"/)?.[1];
      if (name) el.setAttribute("name", name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

function setJsonLd(id: string, data: Record<string, any>) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove();
}

export function setSEO({
  title,
  description,
  path,
  type = "website",
  article,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  article?: { publishedTime?: string; section?: string; tags?: string[] };
}) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${path}`;

  document.title = fullTitle;

  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[property="og:title"]', "content", fullTitle);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:type"]', "content", type);
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[property="og:image"]', "content", DEFAULT_OG_IMAGE);
  setMeta('meta[property="og:site_name"]', "content", SITE_NAME);
  setMeta('meta[name="twitter:card"]', "content", "summary");
  setMeta('meta[name="twitter:title"]', "content", fullTitle);
  setMeta('meta[name="twitter:description"]', "content", description);

  setCanonical(url);

  if (type === "article" && article) {
    setJsonLd("ld-article", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      url,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: BASE_URL,
      },
      ...(article.publishedTime && { datePublished: article.publishedTime }),
      ...(article.section && { articleSection: article.section }),
      ...(article.tags && { keywords: article.tags.join(", ") }),
    });
  } else {
    removeJsonLd("ld-article");
  }
}

export function resetSEO() {
  const defaultTitle = "Travel Advisory — Flights, Visa & Guides";
  const defaultDesc = "Free travel advisory for everyday people. Smart flight search, visa intelligence, and 47 destination guides — no booking fees, no mark-ups.";
  setSEO({ title: defaultTitle, description: defaultDesc, path: "/" });
  removeJsonLd("ld-article");
}

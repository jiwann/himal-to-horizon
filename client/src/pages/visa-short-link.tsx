import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import NotFound from "@/pages/not-found";
import { resolveShortLink } from "@/lib/visa-short-links";

// /visa/brazil, /visa/japan, /visa/uk … — short, sayable links for video
// descriptions. Forwards to the full guide (or country page) without adding
// a history entry, so Back still leaves the site as expected.
export default function VisaShortLinkPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const target = resolveShortLink(slug);

  useEffect(() => {
    if (target) setLocation(target, { replace: true });
  }, [target, setLocation]);

  return target ? null : <NotFound />;
}

import { useEffect } from "react";

const SITE_NAME = "SimplyCool";

export function Seo({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} — ${SITE_NAME}`;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description]);

  return null;
}

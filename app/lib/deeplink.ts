export function buildAddToThemeUrl(
  shopDomain: string,
  apiKey: string,
  handle: string,
): string {
  const cleanShop = shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    `https://${cleanShop}/admin/themes/current/editor?template=index` +
    `&addAppBlockId=${encodeURIComponent(`${apiKey}/${handle}`)}` +
    `&target=newAppsSection`
  );
}

export function buildThemeEditorUrl(shopDomain: string): string {
  const cleanShop = shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${cleanShop}/admin/themes/current/editor?template=index`;
}

export function formatPriceCents(priceCents: number): string {
  if (priceCents <= 0) return "Free";
  return `$${(priceCents / 100).toFixed(2)}`;
}

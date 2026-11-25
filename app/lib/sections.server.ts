import prisma from "../db.server";

export interface CatalogSectionItem {
  id: string;
  handle: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  tier: "FREE" | "PRO";
  priceCents: number;
  demoUrl: string | null;
  previews: unknown;
  isUnlocked: boolean;
  unlockSource: "FREE" | "PRO" | "PURCHASE" | "MANUAL" | null;
}

export async function getCatalogForShop(shopDomain: string) {
  const [shop, categories, sections] = await Promise.all([
    prisma.shop.upsert({
      where: { domain: shopDomain },
      update: {},
      create: { domain: shopDomain, plan: "FREE" },
      include: {
        unlocks: true,
      },
    }),
    prisma.category.findMany({
      orderBy: { sort: "asc" },
    }),
    prisma.section.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true },
      orderBy: { sort: "asc" },
    }),
  ]);

  const unlockBySectionId = new Map(
    shop.unlocks.map((u) => [u.sectionId, u.source] as const),
  );

  const items: CatalogSectionItem[] = sections.map((section) => {
    const manualOrPurchase = unlockBySectionId.get(section.id) ?? null;
    let unlockSource: CatalogSectionItem["unlockSource"] = null;
    if (section.tier === "FREE") {
      unlockSource = "FREE";
    } else if (shop.plan === "PRO") {
      unlockSource = "PRO";
    } else if (manualOrPurchase) {
      unlockSource = manualOrPurchase;
    }

    return {
      id: section.id,
      handle: section.handle,
      name: section.name,
      description: section.description,
      categoryId: section.categoryId,
      categoryName: section.category.name,
      tier: section.tier,
      priceCents: section.priceCents,
      demoUrl: section.demoUrl,
      previews: section.previews,
      isUnlocked: unlockSource !== null,
      unlockSource,
    };
  });

  return {
    shop,
    categories,
    sections: items,
  };
}

export async function recordSectionEvent(
  shopId: string,
  sectionId: string,
  type: "VIEW" | "UNLOCK" | "ADD",
) {
  await prisma.event.create({
    data: {
      shopId,
      sectionId,
      type,
    },
  });
}

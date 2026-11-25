import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Hero", sort: 1 },
    { name: "Testimonials", sort: 2 },
    { name: "FAQ", sort: 3 },
    { name: "USP", sort: 4 },
    { name: "Comparison", sort: 5 },
    { name: "Video", sort: 6 },
    { name: "Bundles", sort: 7 },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });
    if (existing) {
      categoryMap[cat.name] = existing.id;
    } else {
      const created = await prisma.category.create({ data: cat });
      categoryMap[cat.name] = created.id;
    }
  }

  const sections = [
    {
      handle: "hero-split",
      name: "Hero Split",
      description:
        "A versatile split hero section with image-left and image-right layout variants, customizable heading, and responsive visibility controls.",
      categoryId: categoryMap["Hero"],
      tier: "FREE" as const,
      priceCents: 0,
      status: "PUBLISHED" as const,
      sort: 1,
    },
    {
      handle: "testimonial-grid",
      name: "Testimonial Grid",
      description:
        "Social proof grid with customer quotes, star ratings, and multiple card layout variants.",
      categoryId: categoryMap["Testimonials"],
      tier: "PRO" as const,
      priceCents: 799,
      status: "PUBLISHED" as const,
      sort: 2,
    },
    {
      handle: "faq-accordion",
      name: "FAQ Accordion",
      description:
        "Clean expandable FAQ section with single-column and two-column layout variants.",
      categoryId: categoryMap["FAQ"],
      tier: "PRO" as const,
      priceCents: 799,
      status: "PUBLISHED" as const,
      sort: 3,
    },
  ];

  for (const section of sections) {
    await prisma.section.upsert({
      where: { handle: section.handle },
      update: {
        name: section.name,
        description: section.description,
        categoryId: section.categoryId,
        tier: section.tier,
        priceCents: section.priceCents,
        status: section.status,
        sort: section.sort,
      },
      create: section,
    });
  }

  console.log("Seeded categories and initial 3 sections.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

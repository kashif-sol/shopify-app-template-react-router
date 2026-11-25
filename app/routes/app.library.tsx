import { useMemo, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getCatalogForShop,
  recordSectionEvent,
  type CatalogSectionItem,
} from "../lib/sections.server";
import { detectInstalledSectionBlocks } from "../lib/themes.server";
import { buildAddToThemeUrl, formatPriceCents } from "../lib/deeplink";
import { SectionDetailPanel } from "../components/SectionDetailPanel";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const catalog = await getCatalogForShop(session.shop);
  const themeStatus = await detectInstalledSectionBlocks(
    admin,
    catalog.sections.map((s) => s.handle),
  );

  return {
    shopId: catalog.shop.id,
    shopDomain: session.shop,
    apiKey: process.env.SHOPIFY_API_KEY || "",
    categories: catalog.categories,
    sections: catalog.sections,
    installedHandles: themeStatus.installedHandles,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const sectionId = String(formData.get("sectionId") || "");
  const type = String(formData.get("type") || "VIEW") as
    | "VIEW"
    | "UNLOCK"
    | "ADD";

  if (sectionId) {
    const catalog = await getCatalogForShop(session.shop);
    await recordSectionEvent(catalog.shop.id, sectionId, type);
  }

  return { ok: true };
};

export default function SectionLibrary() {
  const {
    shopDomain,
    apiKey,
    categories,
    sections,
    installedHandles,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<"all" | "FREE" | "PRO" | "UNLOCKED">(
    "all",
  );
  const [activeSection, setActiveSection] = useState<CatalogSectionItem | null>(
    null,
  );

  const installedSet = useMemo(
    () => new Set(installedHandles),
    [installedHandles],
  );

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sections.filter((section) => {
      if (selectedCategory !== "all" && section.categoryId !== selectedCategory) {
        return false;
      }
      if (tierFilter === "FREE" && section.tier !== "FREE") return false;
      if (tierFilter === "PRO" && section.tier !== "PRO") return false;
      if (tierFilter === "UNLOCKED" && !section.isUnlocked) return false;
      if (
        q &&
        !section.name.toLowerCase().includes(q) &&
        !(section.description ?? "").toLowerCase().includes(q) &&
        !section.categoryName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [sections, search, selectedCategory, tierFilter]);

  const handleOpenPreview = (section: CatalogSectionItem) => {
    setActiveSection(section);
    fetcher.submit(
      { sectionId: section.id, type: "VIEW" },
      { method: "POST" },
    );
  };

  const handleAddToTheme = (section: CatalogSectionItem, url: string) => {
    fetcher.submit(
      { sectionId: section.id, type: "ADD" },
      { method: "POST" },
    );
    window.open(url, "_top");
  };

  const handleUnlock = (section: CatalogSectionItem) => {
    navigate(`/app/billing?section=${encodeURIComponent(section.handle)}`);
  };

  return (
    <s-page heading="Section Library">
      <s-button
        slot="primary-action"
        variant="secondary"
        onClick={() => navigate("/app/my-sections")}
      >
        My sections
      </s-button>

      {/* Search & Filters */}
      <s-section>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sections (hero, testimonials, FAQ...)"
              style={{
                flex: "1 1 260px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            />
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {(["all", "FREE", "PRO", "UNLOCKED"] as const).map((tier) => (
                <s-button
                  key={tier}
                  variant={tierFilter === tier ? "primary" : "secondary"}
                  onClick={() => setTierFilter(tier)}
                >
                  {tier === "all"
                    ? "All tiers"
                    : tier === "FREE"
                      ? "Free"
                      : tier === "PRO"
                        ? "Pro"
                        : "Unlocked"}
                </s-button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <s-button
              variant={selectedCategory === "all" ? "primary" : "tertiary"}
              onClick={() => setSelectedCategory("all")}
            >
              All categories
            </s-button>
            {categories.map((cat) => (
              <s-button
                key={cat.id}
                variant={selectedCategory === cat.id ? "primary" : "tertiary"}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </s-button>
            ))}
          </div>
        </div>
      </s-section>

      {/* Inline Detail Modal Overlay (Figma 03) */}
      {activeSection && (
        <s-section heading={`Preview: ${activeSection.name}`}>
          <SectionDetailPanel
            section={activeSection}
            shopDomain={shopDomain}
            apiKey={apiKey}
            isInstalledInTheme={installedSet.has(activeSection.handle)}
            onAddToTheme={handleAddToTheme}
            onUnlockClick={handleUnlock}
            onClose={() => setActiveSection(null)}
          />
        </s-section>
      )}

      {/* Card Grid (Figma 02) */}
      <s-section>
        {filteredSections.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
            No sections match your current search or filters.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredSections.map((section) => {
              const addUrl = buildAddToThemeUrl(
                shopDomain,
                apiKey,
                section.handle,
              );
              const previews = (section.previews ?? {}) as {
                desktop?: string;
              };

              return (
                <div
                  key={section.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        height: "150px",
                        background: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px",
                        textAlign: "center",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {previews.desktop ? (
                        <img
                          src={previews.desktop}
                          alt={section.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{ color: "#4b5563", fontSize: "13px" }}>
                          <strong>{section.name}</strong>
                          <div style={{ fontSize: "12px", marginTop: "4px" }}>
                            {section.categoryName}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "6px",
                        }}
                      >
                        <strong style={{ fontSize: "15px" }}>
                          {section.name}
                        </strong>
                        <s-badge
                          tone={section.tier === "FREE" ? "success" : "info"}
                        >
                          {section.tier === "FREE"
                            ? "Free"
                            : formatPriceCents(section.priceCents)}
                        </s-badge>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#4b5563",
                          lineHeight: 1.4,
                        }}
                      >
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "0 14px 14px",
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <s-button
                      variant="secondary"
                      onClick={() => handleOpenPreview(section)}
                    >
                      Preview
                    </s-button>
                    {section.isUnlocked ? (
                      <s-button
                        variant="primary"
                        onClick={() => handleAddToTheme(section, addUrl)}
                      >
                        Add to theme
                      </s-button>
                    ) : (
                      <s-button
                        variant="primary"
                        onClick={() => handleUnlock(section)}
                      >
                        Unlock
                      </s-button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

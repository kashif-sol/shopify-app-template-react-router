import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getCatalogForShop } from "../lib/sections.server";
import { detectInstalledSectionBlocks } from "../lib/themes.server";
import { buildThemeEditorUrl, formatPriceCents } from "../lib/deeplink";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const catalog = await getCatalogForShop(session.shop);
  const themeStatus = await detectInstalledSectionBlocks(
    admin,
    catalog.sections.map((s) => s.handle),
  );

  return {
    shopDomain: session.shop,
    plan: catalog.shop.plan,
    unlockedCount: catalog.sections.filter((s) => s.isUnlocked).length,
    totalCount: catalog.sections.length,
    featuredSections: catalog.sections.slice(0, 3),
    themeStatus,
  };
};

export default function HomeDashboard() {
  const {
    shopDomain,
    plan,
    unlockedCount,
    totalCount,
    featuredSections,
    themeStatus,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const step1Done = true; // App is installed & authenticated
  const step2Done = Boolean(themeStatus.themeId);
  const step3Done = themeStatus.hasAnySection;
  const completedSteps = [step1Done, step2Done, step3Done].filter(Boolean).length;
  const themeEditorUrl = buildThemeEditorUrl(shopDomain);

  return (
    <s-page heading="Section App Dashboard">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => navigate("/app/library")}
      >
        Browse library
      </s-button>

      {/* Plan banner */}
      <s-section>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ fontSize: "16px" }}>
                {plan === "PRO" ? "Section App Pro" : "Free Plan"}
              </strong>
              <s-badge tone={plan === "PRO" ? "success" : "info"}>
                {plan}
              </s-badge>
            </div>
            <p style={{ margin: "6px 0 0", color: "#4b5563", fontSize: "14px" }}>
              {plan === "PRO"
                ? "All sections are unlocked for your store."
                : `${unlockedCount} of ${totalCount} sections unlocked. Upgrade to Pro ($9.99/mo) or unlock individual sections.`}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {plan !== "PRO" && (
              <s-button
                variant="primary"
                onClick={() => navigate("/app/billing")}
              >
                Upgrade to Pro
              </s-button>
            )}
            <s-button
              variant="secondary"
              onClick={() => navigate("/app/my-sections")}
            >
              My sections ({unlockedCount})
            </s-button>
          </div>
        </div>
      </s-section>

      {/* 3-Step Onboarding Card (Technical Plan + Figma 01) */}
      <s-section heading={`Getting started (${completedSteps}/3 completed)`}>
        <div
          style={{
            width: "100%",
            height: "6px",
            background: "#e5e7eb",
            borderRadius: "999px",
            overflow: "hidden",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: `${Math.round((completedSteps / 3) * 100)}%`,
              height: "100%",
              background: "#008060",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "14px",
              background: "#ffffff",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "6px" }}>
              {step1Done ? "✓" : "1."} Enable app
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#4b5563" }}>
              Section App is installed and connected to {shopDomain}.
            </p>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "14px",
              background: "#ffffff",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "6px" }}>
              {step2Done ? "✓" : "2."} Open theme editor
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#4b5563" }}>
              {themeStatus.themeName
                ? `Active theme: ${themeStatus.themeName}`
                : "Open your live theme customizer to place app blocks."}
            </p>
            <s-button
              variant="secondary"
              onClick={() => window.open(themeEditorUrl, "_top")}
            >
              Open theme editor
            </s-button>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "14px",
              background: "#ffffff",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "6px" }}>
              {step3Done ? "✓" : "3."} Add your first section
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#4b5563" }}>
              {step3Done
                ? `Detected ${themeStatus.installedHandles.length} block(s) in your theme.`
                : "Pick a free or unlocked section and click Add to theme."}
            </p>
            <s-button
              variant="primary"
              onClick={() => navigate("/app/library")}
            >
              Browse sections
            </s-button>
          </div>
        </div>
      </s-section>

      {/* Featured Sections */}
      <s-section heading="Featured sections">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {featuredSections.map((section) => (
            <div
              key={section.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "16px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {section.categoryName}
                  </span>
                  <s-badge tone={section.tier === "FREE" ? "success" : "info"}>
                    {section.tier === "FREE"
                      ? "Free"
                      : formatPriceCents(section.priceCents)}
                  </s-badge>
                </div>
                <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px" }}>
                  {section.name}
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#4b5563" }}>
                  {section.description}
                </p>
              </div>
              <s-button
                variant="secondary"
                onClick={() => navigate(`/app/sections/${section.handle}`)}
              >
                Preview section
              </s-button>
            </div>
          ))}
        </div>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

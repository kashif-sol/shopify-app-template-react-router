import { useMemo } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getCatalogForShop } from "../lib/sections.server";
import { detectInstalledSectionBlocks } from "../lib/themes.server";
import { buildAddToThemeUrl } from "../lib/deeplink";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const catalog = await getCatalogForShop(session.shop);
  const unlocked = catalog.sections.filter((s) => s.isUnlocked);
  const themeStatus = await detectInstalledSectionBlocks(
    admin,
    unlocked.map((s) => s.handle),
  );

  return {
    shopDomain: session.shop,
    apiKey: process.env.SHOPIFY_API_KEY || "",
    sections: unlocked,
    installedHandles: themeStatus.installedHandles,
  };
};

export default function MySectionsPage() {
  const { shopDomain, apiKey, sections, installedHandles } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const installedSet = useMemo(
    () => new Set(installedHandles),
    [installedHandles],
  );

  return (
    <s-page heading="My Sections">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => navigate("/app/library")}
      >
        Browse library
      </s-button>

      <s-section>
        {sections.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", color: "#4b5563" }}>
              You haven&apos;t unlocked any sections yet.
            </p>
            <s-button
              variant="primary"
              onClick={() => navigate("/app/library")}
            >
              Explore Section Library
            </s-button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "left",
                    color: "#6b7280",
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "10px 12px" }}>Section</th>
                  <th style={{ padding: "10px 12px" }}>Category</th>
                  <th style={{ padding: "10px 12px" }}>Access</th>
                  <th style={{ padding: "10px 12px" }}>Theme status</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => {
                  const isInTheme = installedSet.has(section.handle);
                  const addUrl = buildAddToThemeUrl(
                    shopDomain,
                    apiKey,
                    section.handle,
                  );

                  return (
                    <tr
                      key={section.id}
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td style={{ padding: "12px", fontWeight: 600 }}>
                        {section.name}
                      </td>
                      <td style={{ padding: "12px", color: "#4b5563" }}>
                        {section.categoryName}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <s-badge tone="success">
                          {section.unlockSource === "FREE"
                            ? "Free"
                            : section.unlockSource === "PRO"
                              ? "Pro Plan"
                              : section.unlockSource === "MANUAL"
                                ? "Unlocked"
                                : "Purchased"}
                        </s-badge>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <s-badge tone={isInTheme ? "info" : "neutral"}>
                          {isInTheme ? "Added to theme" : "Ready to add"}
                        </s-badge>
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "8px",
                        }}
                      >
                        <s-button
                          variant="secondary"
                          onClick={() =>
                            navigate(`/app/sections/${section.handle}`)
                          }
                        >
                          Details
                        </s-button>
                        <s-button
                          variant="primary"
                          onClick={() => window.open(addUrl, "_top")}
                        >
                          Add to theme
                        </s-button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

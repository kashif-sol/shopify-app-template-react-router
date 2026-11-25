import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getCatalogForShop } from "../lib/sections.server";
import { formatPriceCents } from "../lib/deeplink";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const catalog = await getCatalogForShop(session.shop);

  return {
    plan: catalog.shop.plan,
    proSections: catalog.sections.filter((s) => s.tier === "PRO" && !s.isUnlocked),
  };
};

export default function BillingPlansPage() {
  const { plan, proSections } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedHandle = searchParams.get("section");
  const highlightedSection = proSections.find(
    (s) => s.handle === highlightedHandle,
  );

  return (
    <s-page heading="Plans & Billing">
      <s-button
        slot="secondary-actions"
        variant="secondary"
        onClick={() => navigate("/app/library")}
      >
        Browse library
      </s-button>

      {highlightedSection && (
        <s-section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <strong>Unlock “{highlightedSection.name}”</strong>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#4b5563" }}>
                Buy this section once for{" "}
                {formatPriceCents(highlightedSection.priceCents)} or unlock every
                section with Pro (\$9.99/month).
              </p>
            </div>
            <s-badge tone="info">Selected section</s-badge>
          </div>
        </s-section>
      )}

      {/* 3-Card Pricing Layout (Figma 06 + Technical Plan) */}
      <s-section>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Free Tier */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "17px" }}>Free</strong>
                {plan === "FREE" && <s-badge tone="success">Current plan</s-badge>}
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, margin: "10px 0" }}>
                $0
              </div>
              <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#4b5563" }}>
                Start building immediately with our core free sections.
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "18px",
                  fontSize: "13px",
                  color: "#374151",
                  lineHeight: 1.7,
                }}
              >
                <li>3–5 starter sections included</li>
                <li>Works on any Shopify OS 2.0 theme</li>
                <li>Zero theme code edits required</li>
              </ul>
            </div>
            <s-button
              variant="secondary"
              onClick={() => navigate("/app/library")}
            >
              Browse free sections
            </s-button>
          </div>

          {/* Single Section One-Time */}
          <div
            style={{
              border: highlightedSection
                ? "2px solid #008060"
                : "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div>
              <strong style={{ fontSize: "17px" }}>Single Section</strong>
              <div style={{ fontSize: "28px", fontWeight: 700, margin: "10px 0" }}>
                {highlightedSection
                  ? formatPriceCents(highlightedSection.priceCents)
                  : "$5–$15"}
                <span style={{ fontSize: "13px", fontWeight: 400, color: "#6b7280" }}>
                  {" "}
                  one-time
                </span>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#4b5563" }}>
                Pay once and own a single Pro section forever on your store.
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "18px",
                  fontSize: "13px",
                  color: "#374151",
                  lineHeight: 1.7,
                }}
              >
                <li>Lifetime access for your store</li>
                <li>All layout variants included</li>
                <li>Billed securely through Shopify</li>
              </ul>
            </div>
            <s-button
              variant="secondary"
              disabled={!highlightedSection}
              onClick={() => {
                // Wired to appPurchaseOneTimeCreate in Phase 4
              }}
            >
              {highlightedSection
                ? `Buy ${highlightedSection.name}`
                : "Select a section in Library"}
            </s-button>
          </div>

          {/* Pro Subscription */}
          <div
            style={{
              border: "2px solid #111827",
              borderRadius: "12px",
              padding: "20px",
              background: "#111827",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "17px" }}>Section App Pro</strong>
                <s-badge tone="success">
                  {plan === "PRO" ? "Active" : "Best value"}
                </s-badge>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, margin: "10px 0" }}>
                $9.99
                <span style={{ fontSize: "13px", fontWeight: 400, opacity: 0.8 }}>
                  {" "}
                  / month
                </span>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: "13px", opacity: 0.85 }}>
                Unlimited access to every current and future Pro section.
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "18px",
                  fontSize: "13px",
                  opacity: 0.9,
                  lineHeight: 1.7,
                }}
              >
                <li>All Pro sections unlocked instantly</li>
                <li>New sections added automatically</li>
                <li>Cancel anytime in Shopify Billing</li>
              </ul>
            </div>
            <s-button
              variant="primary"
              disabled={plan === "PRO"}
              onClick={() => {
                // Wired to appSubscriptionCreate in Phase 4
              }}
            >
              {plan === "PRO" ? "Pro plan active" : "Upgrade to Pro ($9.99/mo)"}
            </s-button>
          </div>
        </div>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

import { useState } from "react";
import { buildAddToThemeUrl, formatPriceCents } from "../lib/deeplink";
import type { CatalogSectionItem } from "../lib/sections.server";

interface SectionDetailPanelProps {
  section: CatalogSectionItem;
  shopDomain: string;
  apiKey: string;
  isInstalledInTheme: boolean;
  onAddToTheme: (section: CatalogSectionItem, url: string) => void;
  onUnlockClick: (section: CatalogSectionItem) => void;
  onClose?: () => void;
}

export function SectionDetailPanel({
  section,
  shopDomain,
  apiKey,
  isInstalledInTheme,
  onAddToTheme,
  onUnlockClick,
  onClose,
}: SectionDetailPanelProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const addUrl = buildAddToThemeUrl(shopDomain, apiKey, section.handle);

  const previews = (section.previews ?? {}) as {
    desktop?: string;
    mobile?: string;
  };
  const previewUrl =
    device === "desktop" ? previews.desktop : (previews.mobile ?? previews.desktop);

  const step1Done = section.isUnlocked;
  const step2Done = isInstalledInTheme;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 1fr)",
        gap: "24px",
        alignItems: "start",
      }}
    >
      {/* Left: Desktop / Mobile preview frame (Figma 03) */}
      <div
        style={{
          background: "#f6f6f7",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid #e1e3e5",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "13px", color: "#303030" }}>
            Live Layout Preview
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <s-button
              variant={device === "desktop" ? "primary" : "secondary"}
              onClick={() => setDevice("desktop")}
            >
              Desktop
            </s-button>
            <s-button
              variant={device === "mobile" ? "primary" : "secondary"}
              onClick={() => setDevice("mobile")}
            >
              Mobile
            </s-button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "320px",
          }}
        >
          <div
            style={{
              width: device === "mobile" ? "260px" : "100%",
              maxWidth: "100%",
              minHeight: device === "mobile" ? "420px" : "290px",
              background: "#ffffff",
              borderRadius: device === "mobile" ? "28px" : "10px",
              border: device === "mobile" ? "8px solid #1f2937" : "1px solid #d1d5db",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
              textAlign: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`${section.name} ${device} preview`}
                style={{ width: "100%", height: "auto", borderRadius: "6px" }}
              />
            ) : (
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  {section.categoryName} · {device.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: "8px",
                  }}
                >
                  {section.name}
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#4b5563",
                    maxWidth: "340px",
                    margin: "0 auto",
                    lineHeight: 1.5,
                  }}
                >
                  {section.description ||
                    "Responsive Shopify theme app block with multiple layout variants."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Metadata + 05 Get -> Add -> Place flow */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 700 }}>
              {section.name}
            </h2>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <s-badge tone={section.tier === "FREE" ? "success" : "info"}>
                {section.tier === "FREE"
                  ? "Free"
                  : `Pro · ${formatPriceCents(section.priceCents)}`}
              </s-badge>
              {section.isUnlocked && (
                <s-badge tone="success">Unlocked</s-badge>
              )}
              {isInstalledInTheme && (
                <s-badge tone="info">In Theme</s-badge>
              )}
            </div>
          </div>
          {onClose && (
            <s-button variant="tertiary" onClick={onClose}>
              Close
            </s-button>
          )}
        </div>

        <p style={{ margin: 0, fontSize: "14px", color: "#4b5563", lineHeight: 1.5 }}>
          {section.description}
        </p>

        {/* Get -> Add -> Place Flow (Figma 05) */}
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151" }}>
            HOW IT WORKS: GET → ADD → PLACE
          </div>
          <div style={{ fontSize: "13px", color: step1Done ? "#047857" : "#111827" }}>
            {step1Done ? "✓" : "1."} <strong>Get:</strong>{" "}
            {step1Done
              ? "Unlocked for your store"
              : `Unlock once (${formatPriceCents(section.priceCents)}) or go Pro`}
          </div>
          <div style={{ fontSize: "13px", color: step2Done ? "#047857" : "#111827" }}>
            {step2Done ? "✓" : "2."} <strong>Add:</strong> Open Theme Editor with this
            block pre-selected
          </div>
          <div style={{ fontSize: "13px", color: "#111827" }}>
            3. <strong>Place:</strong> Choose your layout variant &amp; drag into
            position
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {section.isUnlocked ? (
            <s-button
              variant="primary"
              onClick={() => onAddToTheme(section, addUrl)}
            >
              Add to theme
            </s-button>
          ) : (
            <s-button
              variant="primary"
              onClick={() => onUnlockClick(section)}
            >
              Unlock for {formatPriceCents(section.priceCents)} or Pro
            </s-button>
          )}

          {section.demoUrl && (
            <s-button
              variant="secondary"
              onClick={() => window.open(section.demoUrl!, "_blank")}
            >
              View live demo
            </s-button>
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: "12px",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          <div>
            <strong>Block handle:</strong> <code>{section.handle}</code>
          </div>
          <div style={{ marginTop: "4px" }}>
            <strong>Included settings:</strong> Layout variant, Heading, Colors,
            Vertical padding, Device visibility
          </div>
        </div>
      </div>
    </div>
  );
}

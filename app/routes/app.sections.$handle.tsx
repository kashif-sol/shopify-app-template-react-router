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
import { SectionDetailPanel } from "../components/SectionDetailPanel";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const handle = params.handle;
  const catalog = await getCatalogForShop(session.shop);
  const section = catalog.sections.find((s) => s.handle === handle);

  if (!section) {
    throw new Response("Section not found", { status: 404 });
  }

  await recordSectionEvent(catalog.shop.id, section.id, "VIEW");

  const themeStatus = await detectInstalledSectionBlocks(admin, [section.handle]);

  return {
    section,
    shopDomain: session.shop,
    apiKey: process.env.SHOPIFY_API_KEY || "",
    isInstalledInTheme: themeStatus.installedHandles.includes(section.handle),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const sectionId = String(formData.get("sectionId") || "");
  if (sectionId) {
    const catalog = await getCatalogForShop(session.shop);
    await recordSectionEvent(catalog.shop.id, sectionId, "ADD");
  }
  return { ok: true };
};

export default function SectionDetailPage() {
  const { section, shopDomain, apiKey, isInstalledInTheme } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();

  const handleAddToTheme = (item: CatalogSectionItem, url: string) => {
    fetcher.submit({ sectionId: item.id }, { method: "POST" });
    window.open(url, "_top");
  };

  return (
    <s-page heading={section.name}>
      <s-button
        slot="secondary-actions"
        variant="secondary"
        onClick={() => navigate("/app/library")}
      >
        Back to library
      </s-button>

      <s-section>
        <SectionDetailPanel
          section={section}
          shopDomain={shopDomain}
          apiKey={apiKey}
          isInstalledInTheme={isInstalledInTheme}
          onAddToTheme={handleAddToTheme}
          onUnlockClick={(item) =>
            navigate(`/app/billing?section=${encodeURIComponent(item.handle)}`)
          }
        />
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

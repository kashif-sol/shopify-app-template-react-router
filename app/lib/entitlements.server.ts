import prisma from "../db.server";

export interface AdminGraphqlClient {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
}

export interface EntitlementPayload {
  all: boolean;
  sections: string[];
}

/**
 * Ensures a Shop row exists for the given myshopify domain and returns its
 * computed entitlements ({ all, sections }).
 */
export async function getShopEntitlements(
  shopDomain: string,
): Promise<EntitlementPayload> {
  const shop = await prisma.shop.upsert({
    where: { domain: shopDomain },
    update: {},
    create: { domain: shopDomain, plan: "FREE" },
    include: {
      unlocks: {
        include: {
          section: {
            select: { handle: true },
          },
        },
      },
    },
  });

  return {
    all: shop.plan === "PRO",
    sections: shop.unlocks.map((u) => u.section.handle),
  };
}

/**
 * Syncs the shop's current entitlements to the $app:section_app.entitlements
 * metafield on the Shop resource so Theme App Extension Liquid blocks can gate
 * rendering.
 */
export async function syncShopEntitlements(
  admin: AdminGraphqlClient,
  shopDomain: string,
): Promise<EntitlementPayload> {
  const entitlements = await getShopEntitlements(shopDomain);

  const shopResponse = await admin.graphql(`
    #graphql
    query GetShopId {
      shop {
        id
      }
    }
  `);
  const shopJson = (await shopResponse.json()) as {
    data?: { shop?: { id: string } };
  };
  const ownerId = shopJson.data?.shop?.id;

  if (!ownerId) {
    throw new Error(`Unable to resolve Shop GID for ${shopDomain}`);
  }

  const mutationResponse = await admin.graphql(
    `
    #graphql
    mutation SyncSectionAppEntitlements($m: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $m) {
        userErrors {
          field
          message
        }
      }
    }
  `,
    {
      variables: {
        m: [
          {
            ownerId,
            namespace: "$app:section_app",
            key: "entitlements",
            type: "json",
            value: JSON.stringify(entitlements),
          },
        ],
      },
    },
  );

  const mutationJson = (await mutationResponse.json()) as {
    data?: {
      metafieldsSet?: {
        userErrors: Array<{ field: string[] | null; message: string }>;
      };
    };
  };

  const userErrors = mutationJson.data?.metafieldsSet?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(
      `Failed to sync entitlements metafield: ${userErrors
        .map((e) => e.message)
        .join("; ")}`,
    );
  }

  return entitlements;
}

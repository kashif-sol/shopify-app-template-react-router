import type { AdminGraphqlClient } from "./entitlements.server";

export interface ThemeDetectionResult {
  themeId: string | null;
  themeName: string | null;
  installedHandles: string[];
  hasAnySection: boolean;
}

/**
 * Reads the active (MAIN) theme's templates/*.json via `read_themes` to detect
 * which Section App blocks have been added by the merchant.
 */
export async function detectInstalledSectionBlocks(
  admin: AdminGraphqlClient,
  knownHandles: string[],
): Promise<ThemeDetectionResult> {
  try {
    const response = await admin.graphql(`
      #graphql
      query GetMainThemeTemplates {
        themes(first: 1, roles: [MAIN]) {
          nodes {
            id
            name
            files(filenames: ["templates/*.json"], first: 20) {
              nodes {
                filename
                body {
                  ... on OnlineStoreThemeFileBodyText {
                    content
                  }
                }
              }
            }
          }
        }
      }
    `);

    const json = (await response.json()) as {
      data?: {
        themes?: {
          nodes?: Array<{
            id: string;
            name: string;
            files?: {
              nodes?: Array<{
                filename: string;
                body?: { content?: string };
              }>;
            };
          }>;
        };
      };
    };

    const mainTheme = json.data?.themes?.nodes?.[0];
    if (!mainTheme) {
      return {
        themeId: null,
        themeName: null,
        installedHandles: [],
        hasAnySection: false,
      };
    }

    const combinedContent = (mainTheme.files?.nodes ?? [])
      .map((f) => f.body?.content ?? "")
      .join("\n");

    const installedHandles = knownHandles.filter(
      (handle) =>
        combinedContent.includes(`/${handle}/`) ||
        combinedContent.includes(`"blocks/${handle}"`) ||
        combinedContent.includes(`/${handle}"`),
    );

    return {
      themeId: mainTheme.id,
      themeName: mainTheme.name,
      installedHandles,
      hasAnySection: installedHandles.length > 0,
    };
  } catch (error) {
    console.warn("Unable to inspect main theme templates:", error);
    return {
      themeId: null,
      themeName: null,
      installedHandles: [],
      hasAnySection: false,
    };
  }
}

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

interface WebManifestIcon {
  readonly src: string;
  readonly sizes?: string;
  readonly type?: string;
  readonly purpose?: string;
}

interface WebManifestShortcut {
  readonly icons?: WebManifestIcon[];
}

interface WebManifestScreenshot {
  readonly src: string;
  readonly sizes?: string;
  readonly type?: string;
  readonly form_factor?: string;
}

interface WebManifest {
  readonly display: string;
  readonly theme_color: string;
  readonly background_color: string;
  readonly icons: WebManifestIcon[];
  readonly shortcuts?: WebManifestShortcut[];
  readonly screenshots?: WebManifestScreenshot[];
}

const publicDir = join(process.cwd(), "public");

/**
 * Reads the static web manifest shipped from `public/`.
 *
 * @returns Parsed web manifest used by browser installability checks.
 */
const readManifest = (): WebManifest => {
  return JSON.parse(
    readFileSync(join(publicDir, "manifest.webmanifest"), "utf8"),
  ) as WebManifest;
};

/**
 * Reads Nuxt config as source so Workbox guardrails can be asserted statically.
 *
 * @returns Raw `nuxt.config.ts` source.
 */
const readNuxtConfig = (): string => {
  return readFileSync(join(process.cwd(), "nuxt.config.ts"), "utf8");
};

/**
 * Checks whether a manifest-referenced public asset exists on disk.
 *
 * @param src Public URL path from the manifest.
 * @returns Whether the file exists under `public/`.
 */
const publicAssetExists = (src: string): boolean => {
  return existsSync(join(publicDir, src.replace(/^\//, "")));
};

describe("PWA installability assets", () => {
  it("declares a branded standalone manifest with PNG any and maskable icons", () => {
    const manifest = readManifest();

    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#44d4ff");
    expect(manifest.background_color).toBe("#06141f");

    const pngIcons = manifest.icons.filter((icon) => icon.type === "image/png");
    expect(pngIcons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/icons/icon-192.png",
          sizes: "192x192",
          purpose: "any",
        }),
        expect.objectContaining({
          src: "/icons/icon-512.png",
          sizes: "512x512",
          purpose: "any",
        }),
        expect.objectContaining({
          src: "/icons/icon-maskable-512.png",
          sizes: "512x512",
          purpose: "maskable",
        }),
      ]),
    );

    for (const icon of pngIcons) {
      expect(publicAssetExists(icon.src)).toBe(true);
    }
  });

  it("ships shortcut icons, screenshots and an offline fallback shell", () => {
    const manifest = readManifest();

    expect(publicAssetExists("/apple-touch-icon.png")).toBe(true);
    expect(publicAssetExists("/offline.html")).toBe(true);

    for (const shortcut of manifest.shortcuts ?? []) {
      expect(shortcut.icons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          }),
        ]),
      );
    }

    expect(manifest.screenshots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/screenshots/pwa-dashboard-wide.png",
          sizes: "1280x720",
          type: "image/png",
          form_factor: "wide",
        }),
        expect.objectContaining({
          src: "/screenshots/pwa-dashboard-mobile.png",
          sizes: "390x844",
          type: "image/png",
          form_factor: "narrow",
        }),
      ]),
    );

    for (const screenshot of manifest.screenshots ?? []) {
      expect(publicAssetExists(screenshot.src)).toBe(true);
    }
  });

  it("keeps Workbox focused on shell assets and excludes API data from offline fallback", () => {
    const nuxtConfig = readNuxtConfig();

    expect(nuxtConfig).toContain("navigateFallback: \"/offline.html\"");
    expect(nuxtConfig).toContain("navigateFallbackDenylist");
    expect(nuxtConfig).toContain("Never cache API calls");
    expect(nuxtConfig).not.toMatch(/urlPattern:\s*\/api\//);
  });
});

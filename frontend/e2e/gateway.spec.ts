import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __gatewayRestoreWebGLContext?: () => void;
  }
}

test("root entry defaults to the German experience", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/de\/?$/);
  await expect(page.getByRole("heading", { name: "Ihr Name" })).toBeVisible();
  await expect(page.getByText("Berufsbezeichnung")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue in English" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Auf Deutsch" })).toHaveCount(0);
});

test("localized routes, legal links, and deck cards are reachable", async ({
  page,
}) => {
  await page.goto("/en/", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Your Name" })).toBeVisible();

  await expect(
    page.getByRole("group", { name: /Reference 0[1-4]/ }).first(),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Email" }).first(),
  ).toBeVisible();

  await page.goto("/de/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Berufsbezeichnung")).toBeVisible();

  await page.goto("/de/datenschutz/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByText("Diese Vorlage enthält keine produktiven rechtlichen Angaben."),
  ).toBeVisible();
});

test("world frame iframe target renders", async ({ page }) => {
  await page.goto("/world-frame/", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("World frame")).toBeVisible();
});

test("world frame recovers after WebGL context events", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "desktop-only WebGL recovery check");

  await page.goto("/world-frame/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(1200);

  const lossResult = await page.evaluate(async () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    const gl =
      canvas?.getContext("webgl2") ??
      canvas?.getContext("webgl") ??
      canvas?.getContext("experimental-webgl");
    const contextLoss = gl?.getExtension("WEBGL_lose_context");

    if (!canvas || !gl || !contextLoss) {
      return { supported: false, prevented: false, lost: false };
    }

    const prevented = await new Promise<boolean>((resolve) => {
      const timeout = window.setTimeout(() => resolve(false), 1000);
      canvas.addEventListener(
        "webglcontextlost",
        (event) => {
          window.clearTimeout(timeout);
          resolve(event.defaultPrevented);
        },
        { once: true },
      );
      contextLoss.loseContext();
    });

    window.__gatewayRestoreWebGLContext = () => contextLoss.restoreContext();

    return {
      supported: true,
      prevented,
      lost: gl.isContextLost(),
    };
  });

  test.skip(!lossResult.supported, "WEBGL_lose_context is unavailable");
  expect(lossResult.prevented).toBe(true);
  expect(lossResult.lost).toBe(true);

  await expect(page.locator(".water-poster-fallback")).toHaveCount(1, {
    timeout: 5000,
  });
  await page.evaluate(() => {
    window.__gatewayRestoreWebGLContext?.();
  });
  await expect(page.locator(".water-poster-fallback")).toHaveCount(0, {
    timeout: 20000,
  });
  await expect(page.locator("canvas")).toBeVisible();
});

test("graph project popup closes with Escape", async ({ page }) => {
  await page.goto("/en/", { waitUntil: "domcontentloaded" });

  const closeButton = page.getByRole("button", { name: "Close" });
  await expect(closeButton).toBeVisible({ timeout: 20000 });

  await page.keyboard.press("Escape");
  await expect(closeButton).toBeHidden();
});

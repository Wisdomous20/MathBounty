import { test, expect, Page } from "@playwright/test";

async function mockEthereum(page: Page) {
  await page.addInitScript(() => {
    const zeroAddr = "0x0000000000000000000000000000000000000000";
    const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    // ABI-encoded tuple (address, bytes32, uint256, uint256, uint8) all zeros
    const emptyBountyResult =
      "0x" +
      zeroAddr.slice(2).padStart(64, "0") +
      zeroHash.slice(2) +
      "0".repeat(64) +
      "0".repeat(64) +
      "0".repeat(64);

    (window as unknown as { ethereum: unknown }).ethereum = {
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        if (method === "eth_requestAccounts" || method === "eth_accounts") {
          return ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"];
        }
        if (method === "eth_chainId") {
          return "0xaa36a7"; // Sepolia
        }
        if (method === "eth_getBalance") {
          return "0x0de0b6b3a7640000"; // 1 ETH
        }
        if (method === "eth_call") {
          return emptyBountyResult;
        }
        if (method === "eth_estimateGas") {
          return "0x5208";
        }
        if (method === "eth_sendTransaction") {
          return "0xtxhash000000000000000000000000000000000000000000000000000000000000";
        }
        if (method === "eth_getTransactionReceipt") {
          return {
            status: "0x1",
            transactionHash: "0xtxhash000000000000000000000000000000000000000000000000000000000000",
            logs: [],
          };
        }
        return null;
      },
      on: () => {},
      removeListener: () => {},
    };
  });
}

test.describe("/new page", () => {
  test.beforeEach(async ({ page }) => {
    await mockEthereum(page);
    await page.goto("http://localhost:3000/new");
  });

  test("renders the bounty form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /post a bounty/i })).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/problem statement/i)).toBeVisible();
    await expect(page.getByLabel(/correct answer/i)).toBeVisible();
    await expect(page.getByLabel(/reward/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /post bounty/i })).toBeVisible();
  });

  test("shows validation errors for empty fields", async ({ page }) => {
    // Acknowledge irreversibility to enable the submit button
    await page.getByText(/i understand this transaction is irreversible/i).click();
    // Bypass HTML5 required validation to test React validation logic
    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) form.noValidate = true;
    });
    await page.getByRole("button", { name: /post bounty/i }).click();

    await expect(page.getByText(/title is required/i)).toBeVisible();
    await expect(page.getByText(/problem statement is required/i)).toBeVisible();
    await expect(page.getByText(/correct answer is required/i)).toBeVisible();
    await expect(page.getByText(/reward must be at least/i)).toBeVisible();
  });

  test("allows filling the form", async ({ page }) => {
    await page.getByLabel(/title/i).fill("Test Bounty");
    await page.getByLabel(/problem statement/i).fill("Solve this test problem.");
    await page.getByLabel(/correct answer/i).fill("42");
    await page.getByLabel(/reward/i).fill("1.5");

    await expect(page.getByLabel(/title/i)).toHaveValue("Test Bounty");
    await expect(page.getByLabel(/correct answer/i)).toHaveValue("42");
    await expect(page.getByLabel(/reward/i)).toHaveValue("1.5");
  });

  test("expiry buttons allow selection", async ({ page }) => {
    await page.getByRole("button", { name: /7 days/i }).click();
    // The active button should have the brand background class
    const activeBtn = page.locator("button.bg-brand", { hasText: /7 days/i });
    await expect(activeBtn).toBeVisible();
  });
});

test.describe("/bounty/[id] page", () => {
  test.beforeEach(async ({ page }) => {
    await mockEthereum(page);
  });

  test("renders bounty detail page without crashing", async ({ page }) => {
    await page.goto("http://localhost:3000/bounty/1");
    // Page will either load the bounty heading or show an error — either proves it rendered
    await expect(page.getByRole("heading", { name: /bounty #1/i }).or(page.getByText(/failed to load/i))).toBeVisible();
  });

  test("shows loading state or result immediately", async ({ page }) => {
    await page.goto("http://localhost:3000/bounty/1");
    // With mocked provider the loading state is transient; assert page rendered
    await expect(
      page.getByText(/loading bounty data from chain/i)
        .or(page.getByRole("heading", { name: /bounty #1/i }))
        .or(page.getByText(/failed to load/i))
    ).toBeVisible();
  });
});

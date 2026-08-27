import { expect, test, type APIRequestContext } from "@playwright/test";

const password = "LaunchTestPassword123!";

test("a team can verify accounts, collaborate, and complete the core Kanban workflow", async ({ page, request, browser }) => {
    const email = `launch-${Date.now()}@example.com`;
    const partnerEmail = `partner-${Date.now()}@example.com`;
    await page.goto("/");
    await page.getByRole("button", { name: "Need an account? Register" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Register", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Check your email");

    const verificationUrl = await waitForVerificationUrl(request, email);
    await page.goto(verificationUrl);
    await expect(page.getByRole("banner").getByRole("img", { name: "Sweet Mahogany Boards" })).toBeVisible();

    await page.getByLabel("New workspace name").fill("Launch QA");
    await page.getByRole("button", { name: "+ Workspace" }).click();
    await expect(page.getByRole("heading", { name: "No board yet" })).toBeVisible();

    await page.getByLabel("New board name").fill("Release Board");
    await page.getByRole("button", { name: "+ Board" }).click();
    await expect(page.getByRole("heading", { name: "Release Board" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();

    await page.getByLabel("New column name").fill("Review");
    await page.getByRole("button", { name: "+ Column" }).click();
    await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete column Ready" }).click();
    await expect(page.getByRole("heading", { name: "Ready" })).toHaveCount(0);

    await page.getByLabel("New card title for Backlog").fill("Production smoke test");
    await page.getByRole("button", { name: "Add card to Backlog" }).click();
    await expect(page.getByRole("heading", { name: "Production smoke test" })).toBeVisible();
    await expect(page.getByTitle("Team synchronization status")).toContainText("Live");

    await page.getByRole("button", { name: "Team" }).click();
    await page.getByLabel("Teammate email").fill(partnerEmail);
    await page.getByRole("button", { name: "Send invite" }).click();
    await expect(page.getByText(partnerEmail)).toBeVisible();
    const invitationUrl = await waitForInvitationUrl(request, partnerEmail);
    await page.getByRole("button", { name: "Close team settings" }).click();

    const partnerContext = await browser.newContext();
    const partnerPage = await partnerContext.newPage();
    await partnerPage.goto(invitationUrl);
    await partnerPage.getByRole("button", { name: "Need an account? Register" }).click();
    await partnerPage.getByLabel("Email").fill(partnerEmail);
    await partnerPage.getByLabel("Password").fill(password);
    await partnerPage.getByRole("button", { name: "Register", exact: true }).click();
    await expect(partnerPage.getByText("You joined Launch QA.")).toBeVisible();
    await expect(partnerPage.getByRole("heading", { name: "Release Board" })).toBeVisible();
    await expect(partnerPage.getByTitle("Team synchronization status")).toContainText("Live");
    await partnerPage.getByLabel("New card title for Backlog").fill("Partner iPad task");
    await partnerPage.getByRole("button", { name: "Add card to Backlog" }).click();
    await expect(partnerPage.getByRole("heading", { name: "Partner iPad task" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Partner iPad task" })).toBeVisible({ timeout: 10_000 });

    await partnerPage.getByRole("button", { name: "Account" }).click();
    await partnerPage.getByLabel("Current password").fill(password);
    await partnerPage.getByLabel("Type DELETE to confirm").fill("DELETE");
    await partnerPage.getByRole("button", { name: "Delete my account" }).click();
    await partnerContext.close();

    await page.getByRole("button", { name: "Account" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download export" }).click();
    expect((await download).suggestedFilename()).toMatch(/^sweet-mahogany-boards-export-/);

    await page.getByLabel("Current password").fill(password);
    await page.getByLabel("Type DELETE to confirm").fill("DELETE");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

async function waitForVerificationUrl(request: APIRequestContext, email: string) {
    const mailpitUrl = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";
    for (let attempt = 0; attempt < 30; attempt++) {
        const response = await request.get(`${mailpitUrl}/view/latest.txt?query=${encodeURIComponent(`to:${email}`)}`);
        if (response.ok()) {
            const url = (await response.text()).match(/https?:\/\/[^\s]+\?verifyToken=[^\s]+/)?.[0];
            if (url) return url.trim();
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`Verification email was not received for ${email}.`);
}

async function waitForInvitationUrl(request: APIRequestContext, email: string) {
    const mailpitUrl = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";
    for (let attempt = 0; attempt < 30; attempt++) {
        const response = await request.get(`${mailpitUrl}/view/latest.txt?query=${encodeURIComponent(`to:${email}`)}`);
        if (response.ok()) {
            const url = (await response.text()).match(/https?:\/\/[^\s]+\?inviteToken=[^\s]+/)?.[0];
            if (url) return url.trim();
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`Invitation email was not received for ${email}.`);
}

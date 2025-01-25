import {Locator, test} from "@playwright/test";
import {downloadFileByClickOnElement, downloadFileFromDirectLink} from "../src/helper";

test('Download a pdf file by clicking on a button', async ({ page }): Promise<void> => {
    await page.goto('https://demo.automationtesting.in/FileDownload.html');

    const downloadButton: Locator = page.locator('a.btn-primary');

    await downloadFileByClickOnElement(page, downloadButton);
});

test('Download a file from a direct link', async ({}): Promise<void> => {
    await downloadFileFromDirectLink('https://files.testfile.org/PDF/10MB-TESTFILE.ORG.pdf');
});

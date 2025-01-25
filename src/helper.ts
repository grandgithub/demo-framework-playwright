import {promises} from "fs";
import {APIRequestContext, APIResponse, Download, expect, Locator, Page, request} from "@playwright/test";
import * as fs from 'fs';

export async function doesFileExist(filenameWithPath: string): Promise<boolean> {
    try {
        await promises.access(filenameWithPath);
        console.log(`File exists at path: ${filenameWithPath}`);

        return true;
    } catch (error) {
        console.error(`File does not exist or cannot be accessed: ${filenameWithPath}`);

        return false;
    }
}

export async function downloadFileByClickOnElement(workingPage: Page, webElement: Locator, filename?: string): Promise<void> {
    const downloadPromise: Promise<Download> = workingPage.waitForEvent('download');

    await webElement.click();

    const download: Download = await downloadPromise;
    const filenameWithPath: string = './test-results/' + (filename || download.suggestedFilename());

    await download.saveAs(filenameWithPath);
    expect(await doesFileExist(filenameWithPath)).toBeTruthy();
}

export async function downloadFileFromDirectLink(linkWithFile: string, downloadPath: string = './test-results/'): Promise<void> {
    const filename: string = linkWithFile.split('/').pop();
    const downloadPathWithFilename: string = `${downloadPath}${filename}`;
    const apiContext: APIRequestContext = await request.newContext();
    const response: APIResponse = await apiContext.get(linkWithFile);

    expect(response.ok()).toBeTruthy();

    const fileBuffer: Buffer = await response.body();

    fs.writeFileSync(downloadPathWithFilename, fileBuffer);
    expect(await doesFileExist(downloadPathWithFilename)).toBeTruthy();
}

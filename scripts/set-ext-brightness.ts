// Name: Set Ext Brightness
// Description: Sets external display brightness on Windows and macOS
// Author: Barraki

import "@johnlindquist/kit";
import ddcci from "@hensm/ddcci";
import { parseDisplayPath } from "../utils/parseDisplayPath";
import { DisplayObject } from "../types/ddc";

/**
 * Sets the brightness of external displays on Windows using DDC/CI
 */
async function setWindowsBrightness(percentage: number): Promise<void> {
  try {
    // Get all available displays
    const displays: string[] = ddcci.getMonitorList();
    const displayCount = displays.length;

    // Parse and log display information
    const displayObjects: DisplayObject[] = displays.map(parseDisplayPath);

    if (displayCount === 0) {
      await div(md(`No DDC/CI compatible monitors found.`));
      return;
    }

    // If there's more than one monitor, ask user which one to adjust
    let selectedDisplayIndex: DisplayObject | undefined;

    if (displayCount === 1) {
      selectedDisplayIndex = displayObjects[0];
    } else {
      const displayChoices = displayObjects.map((display, index) => ({
        name: `${display.manufacturer}${display.model} ${index === 0 ? "(Primary)" : ""}`,
        value: display,
      }));

      selectedDisplayIndex = await arg(
        {
          placeholder: "Select display to adjust:",
          hint: "Choose the display you want to adjust",
        },
        displayChoices
      );
    }

    // Get current brightness
    const currentBrightness = ddcci.getBrightness(
      selectedDisplayIndex.raw
    );
    console.warn(`The current brightness settings: ${currentBrightness}%`);

    // Set new brightness
    ddcci.setBrightness(selectedDisplayIndex.raw, percentage);

    // Verify the change
    const newBrightness = ddcci.getBrightness(selectedDisplayIndex.raw);

    if (newBrightness !== percentage) {
      console.warn(`Something went wrong. The new brightness is did't set.`);
      return;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`DDC/CI error:`, errorMessage);
    await div(
      md(
        `Error setting brightness. Make sure DDC/CI is enabled on your monitor.\n\n${errorMessage}`
      )
    );
  }
}

/**
 * Sets the brightness of an external display on macOS using `ddcctl`.
 *
 * @param percentage The desired brightness percentage (0-100).
 */
async function setMacBrightness(percentage: number): Promise<void> {
  if (process.platform !== "darwin") {
    await div(md(`This script only works on macOS.`));
    return;
  }

  // Execute ddcctl to list displays
  const displayListOutput = await exec("/usr/local/bin/ddcctl -l");

  if (displayListOutput.stderr) {
    console.error(`ddcctl error: ${displayListOutput.stderr}`);
    await div(
      md(
        `Error listing displays. Ensure "ddcctl" is installed and in /usr/local/bin.`
      )
    );
    return;
  }

  const lines: string[] = displayListOutput.stdout.trim().split("\n");

  if (lines.length === 0) {
    await div(md(`No displays detected using /usr/local/bin/ddcctl.`));
    return;
  }

  let externalDisplayId: number | undefined = undefined;

  // Iterate through detected displays and ask the user to identify the external one
  for (const line of lines) {
    const match: RegExpMatchArray | null = line.match(/Display (\d+)/);
    if (match) {
      const displayId: number = parseInt(match[1], 10);

      if (isNaN(displayId)) {
        console.warn(`Could not parse display ID from line: ${line}`);
        continue; // Skip to the next line if parsing fails
      }

      // Ask user for confirmation using `arg` prompt
      if (
        (await arg(
          {
            placeholder: `Is display ${displayId} the external display?`,
            strict: false, // Allow submitting without choosing from options
          },
          [
            { name: "Yes", value: "yes" },
            { name: "No", value: "no" },
          ]
        )) === "yes"
      ) {
        externalDisplayId = displayId;
        break; // Exit loop after user confirmation
      }
    }
  }

  if (externalDisplayId === undefined) {
    await div(md(`No external display selected.`));
    return;
  }

  // Execute ddcctl command to set brightness for the selected external display
  try {
    await exec(
      `/usr/local/bin/ddcctl -d ${externalDisplayId} -b ${percentage}`
    );
  } catch (error: any) {
    console.error(
      `ddcctl set brightness error: ${error.stderr || error.message}`
    );
    await div(
      md(
        `Error setting brightness. Ensure "ddcctl" is installed and configured correctly. \n\n ${
          error.stderr || error.message
        }`
      )
    );
  }
}

/**
 * Sets display brightness based on the operating system
 */
async function setBrightness(percentage: number): Promise<void> {
  if (process.platform === "win32") {
    await setWindowsBrightness(percentage);
  } else if (process.platform === "darwin") {
    await setMacBrightness(percentage);
  } else {
    await div(md(`This script only works on Windows and macOS.`));
    return;
  }
}

// Prompt the user to enter the desired brightness percentage
const brightnessPercentage: string = await arg(
  "Enter desired brightness (0-100):"
);
const brightness: number = parseInt(brightnessPercentage, 10);

// Validate the brightness input
if (isNaN(brightness) || brightness < 0 || brightness > 100) {
  await div(
    md(
      `Invalid brightness value: ${brightnessPercentage}. Please enter a number between 0 and 100.`
    )
  );
} else {
  await setBrightness(brightness);
  div(md(`Brightness set to ${brightness}%`));
}

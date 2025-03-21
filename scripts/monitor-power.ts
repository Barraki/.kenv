// Name: Display Power Mode
// Description: Change the power mode of the external display
// Author: Barraki

import "@johnlindquist/kit"
import { DisplayObject } from "../types/ddc";
import { parseDisplayPath } from "../utils/parseDisplayPath";
import ddcci from "@hensm/ddcci";
import { VCPFeatureCode } from "@ddc-node/ddc-node";
import { powerModes } from "../constants/displays";

const displayObjects: DisplayObject[] = ddcci.getMonitorList().map(parseDisplayPath);

const displayChoices = displayObjects.map((display, index) => ({
  name: `${display.manufacturer}${display.model} ${index === 0 ? "(Primary)" : ""}`,
  value: index,
}));

const selectedDisplayIndex = await arg({
  placeholder: "Select display to toggle power:",
  hint: "Choose the display you want to toggle power",
}, displayChoices);
const selectedDisplay = displayObjects[selectedDisplayIndex];

const powerMode = ddcci._getVCP(selectedDisplay.raw, VCPFeatureCode.DisplayControl.PowerMode);
console.warn(`The current power mode: ${powerMode}`);

const newPowerMode = await arg({
  placeholder: "Enter the new power mode (1-4):",
  hint: "Enter the new power mode (1-4)",
}, powerModes);

ddcci._setVCP(selectedDisplay.raw, VCPFeatureCode.DisplayControl.PowerMode, Number(newPowerMode));

console.log(`The new power status: ${powerModes.find((mode) => mode.value === newPowerMode)?.name}`);

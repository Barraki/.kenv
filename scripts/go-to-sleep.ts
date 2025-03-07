// Name: Go to sleep
// Description: Run a group of other scripts to prepare for sleep
// Author: Barraki

import "@johnlindquist/kit";

/**
 * Array of script names to run sequentially.
 * These scripts should be available in your Script Kit environment.
 */
const scriptsToRun: { command: string; args: string[] }[] = [
  {
    command: "set-ext-brightness",
    args: ["0", "0"],
  },
  {
    command: "set-ext-brightness",
    args: ["0", "1"],
  },
];

for (const script of scriptsToRun) {
  try {
    /**
     * Run each script by name.
     * `run` is a global function provided by Script Kit to execute other scripts.
     * https://johnlindquist.github.io/kit-docs/#run
     */
    await run(script.command, ...script.args);
  } catch (error) {
    /**
     * Basic error handling: log any errors that occur during script execution.
     * For more robust error handling, consider adding specific error type checking or more detailed logging.
     */
    console.error(`Error running script ${script.command}:`, error);
  }
}

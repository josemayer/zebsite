const { exec } = require("child_process");
const path = require("path");

const SCRIPT_PATH = path.resolve(__dirname, "../../../mine-server/manage-mc.py");

/**
 * Execute the Python manage-mc.py script with a given command
 * @param {string} command - "up", "down", or "restart"
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    let pyCommand;

    switch (command) {
      case "on":
        pyCommand = "up";
        break;
      case "off":
        pyCommand = "down";
        break;
      case "restart":
        pyCommand = "restart";
        break;
      default:
        return reject({ statusCode: 400, message: "Invalid state" });
    }

    exec(`python3 ${SCRIPT_PATH} ${pyCommand}`, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error executing Python script:`, stderr || err.message);
        return reject({
          statusCode: 500,
          message: stderr || err.message || "Python script failed",
        });
      }

      resolve({
        state: command,
        details: stdout.trim() || "Command executed successfully",
      });
    });
  });
}

/**
 * Set the Minecraft server state: "on", "off", "restart"
 * @param {string} state
 */
async function setState(state) {
  try {
    const result = await runCommand(state);
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  setState,
};


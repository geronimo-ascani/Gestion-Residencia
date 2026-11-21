import { spawn } from "node:child_process";
import process from "node:process";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("\x1b[36m%s\x1b[0m", " Iniciando Sistema de Gestión de Residencia");
console.log("\x1b[36m%s\x1b[0m", " Backend API (Puerto 3000) + Frontend (Puerto 5173)");
console.log("\x1b[36m%s\x1b[0m", "==================================================");

// Iniciar Backend
const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: "Backend",
  stdio: "inherit",
  shell: isWindows,
});

// Iniciar Frontend
const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: "Frontend",
  stdio: "inherit",
  shell: isWindows,
});

function cleanup() {
  console.log("\n\x1b[33m%s\x1b[0m", "Deteniendo servidores...");
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

backend.on("error", (err) => {
  console.error("\x1b[31mError en el proceso de Backend:\x1b[0m", err);
});

frontend.on("error", (err) => {
  console.error("\x1b[31mError en el proceso de Frontend:\x1b[0m", err);
});

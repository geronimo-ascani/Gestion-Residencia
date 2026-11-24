import { spawn, execSync } from "node:child_process";
import readline from "node:readline";
import process from "node:process";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("\x1b[36m%s\x1b[0m", " Iniciando Sistema de Gestión de Residencia");
console.log("\x1b[36m%s\x1b[0m", " Backend API (Puerto 3000) + Frontend (Puerto 5173)");
console.log("\x1b[36m%s\x1b[0m", "==================================================");

/**
 * Libera un puerto si ya está en uso por un proceso huérfano anterior (evita errores EADDRINUSE).
 */
function freePort(port) {
  if (isWindows) {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf-8" });
      const lines = out.trim().split("\n");
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const state = parts[3];
        const pid = parts[parts.length - 1];
        if (state === "LISTENING" && pid && pid !== "0" && pid !== String(process.pid)) {
          console.log(`\x1b[33m[Dev]\x1b[0m Liberando puerto ${port} (PID anterior ${pid})...`);
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          } catch {}
        }
      }
    } catch {}
  }
}

function killProcessTree(pid) {
  if (!pid) return;
  if (isWindows) {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    } catch {}
  } else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try { process.kill(pid, "SIGTERM"); } catch {}
    }
  }
}

function pipeOutput(stream, prefix, color) {
  if (!stream) return;
  const rl = readline.createInterface({ input: stream, terminal: false });
  rl.on("line", (line) => {
    console.log(`${color}${prefix}\x1b[0m ${line}`);
  });
}

// Iniciar Backend
const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: "Backend",
  stdio: ["inherit", "pipe", "pipe"],
  shell: isWindows,
});
pipeOutput(backend.stdout, "[Backend]", "\x1b[36m");
pipeOutput(backend.stderr, "[Backend Error]", "\x1b[31m");

// Iniciar Frontend
const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: "Frontend",
  stdio: ["inherit", "pipe", "pipe"],
  shell: isWindows,
});
pipeOutput(frontend.stdout, "[Frontend]", "\x1b[35m");
pipeOutput(frontend.stderr, "[Frontend Error]", "\x1b[31m");

let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log("\n\x1b[33m%s\x1b[0m", "Deteniendo servidores...");
  if (backend?.pid) killProcessTree(backend.pid);
  if (frontend?.pid) killProcessTree(frontend.pid);
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

backend.on("error", (err) => {
  console.error("\x1b[31mError en el proceso de Backend:\x1b[0m", err);
});

frontend.on("error", (err) => {
  console.error("\x1b[31mError en el proceso de Frontend:\x1b[0m", err);
});

import { cpus, totalmem, freemem, loadavg, hostname, uptime, platform, arch } from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface ProcessInfo {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  vsz: string;
  rss: string;
  tty: string;
  stat: string;
  start: string;
  time: string;
  command: string;
}

interface CpuUsage {
  core: number;
  usage: number;
  user: number;
  system: number;
  idle: number;
}

interface BatteryInfo {
  hasBattery: boolean;
  charging: boolean;
  acPowered: boolean;
  percent: number;
  timeRemainingMin: number | null;
  cycleCount: number | null;
  designCapacity: number | null;
  maxCapacity: number | null;
  healthPercent: number | null;
  condition: string | null;
  temperatureC: number | null;
}

interface SystemMetrics {
  hostname: string;
  platform: string;
  arch: string;
  uptime: number;
  loadAvg: number[];
  cpuCount: number;
  cpuModel: string;
  cpuUsage: CpuUsage[];
  totalMem: number;
  freeMem: number;
  usedMem: number;
  memPercent: number;
  processes: ProcessInfo[];
  processCount: number;
  battery: BatteryInfo;
  timestamp: number;
}

// Store previous CPU times for calculating usage
let prevCpuTimes: { user: number; nice: number; sys: number; idle: number; irq: number }[] = [];

function getCpuUsage(): CpuUsage[] {
  const cpuInfo = cpus();
  const usage: CpuUsage[] = [];

  cpuInfo.forEach((cpu, index) => {
    const total = cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    const prev = prevCpuTimes[index];

    if (prev) {
      const prevTotal = prev.user + prev.nice + prev.sys + prev.idle + prev.irq;
      const totalDiff = total - prevTotal;
      const idleDiff = cpu.times.idle - prev.idle;
      const userDiff = cpu.times.user - prev.user;
      const sysDiff = cpu.times.sys - prev.sys;

      if (totalDiff > 0) {
        usage.push({
          core: index,
          usage: Math.round(((totalDiff - idleDiff) / totalDiff) * 100),
          user: Math.round((userDiff / totalDiff) * 100),
          system: Math.round((sysDiff / totalDiff) * 100),
          idle: Math.round((idleDiff / totalDiff) * 100),
        });
      } else {
        usage.push({ core: index, usage: 0, user: 0, system: 0, idle: 100 });
      }
    } else {
      // First run, estimate from current times
      const usagePercent = Math.round(((total - cpu.times.idle) / total) * 100);
      usage.push({
        core: index,
        usage: usagePercent,
        user: Math.round((cpu.times.user / total) * 100),
        system: Math.round((cpu.times.sys / total) * 100),
        idle: Math.round((cpu.times.idle / total) * 100),
      });
    }

    prevCpuTimes[index] = { ...cpu.times };
  });

  return usage;
}

async function getProcesses(): Promise<ProcessInfo[]> {
  const os = platform();
  let command: string;

  if (os === "darwin") {
    // macOS - use ps with specific format
    command = "ps aux -r | head -50";
  } else {
    // Linux
    command = "ps aux --sort=-%cpu | head -50";
  }

  try {
    const { stdout } = await execAsync(command);
    const lines = stdout.trim().split("\n");
    const processes: ProcessInfo[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length >= 11) {
        processes.push({
          user: parts[0],
          pid: parseInt(parts[1], 10),
          cpu: parseFloat(parts[2]),
          mem: parseFloat(parts[3]),
          vsz: formatBytes(parseInt(parts[4], 10) * 1024),
          rss: formatBytes(parseInt(parts[5], 10) * 1024),
          tty: parts[6],
          stat: parts[7],
          start: parts[8],
          time: parts[9],
          command: parts.slice(10).join(" ").substring(0, 80),
        });
      }
    }

    return processes;
  } catch (error) {
    console.error("Error getting processes:", error);
    return [];
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "K", "M", "G", "T"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

async function getMemoryInfo(): Promise<{ total: number; free: number; used: number; percent: number }> {
  const totalMemory = totalmem();
  const os = platform();

  if (os === "darwin") {
    // macOS: use vm_stat to get accurate available memory
    // freemem() only reports "free" pages, not inactive/purgeable which are also available
    try {
      const { stdout } = await execAsync("vm_stat");
      const lines = stdout.split("\n");

      // Parse page size
      const pageSizeMatch = lines[0].match(/page size of (\d+) bytes/);
      const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1], 10) : 16384;

      // Parse memory pages
      let freePages = 0;
      let inactivePages = 0;
      let purgeablePages = 0;
      let speculativePages = 0;

      for (const line of lines) {
        if (line.includes("Pages free:")) {
          freePages = parseInt(line.match(/(\d+)/)?.[1] || "0", 10);
        } else if (line.includes("Pages inactive:")) {
          inactivePages = parseInt(line.match(/(\d+)/)?.[1] || "0", 10);
        } else if (line.includes("Pages purgeable:")) {
          purgeablePages = parseInt(line.match(/(\d+)/)?.[1] || "0", 10);
        } else if (line.includes("Pages speculative:")) {
          speculativePages = parseInt(line.match(/(\d+)/)?.[1] || "0", 10);
        }
      }

      // Available memory = free + inactive + purgeable + speculative
      const availableMemory = (freePages + inactivePages + purgeablePages + speculativePages) * pageSize;
      const usedMemory = totalMemory - availableMemory;

      return {
        total: totalMemory,
        free: availableMemory,
        used: usedMemory,
        percent: Math.round((usedMemory / totalMemory) * 100),
      };
    } catch {
      // Fallback to freemem if vm_stat fails
    }
  } else if (os === "linux") {
    // Linux: read /proc/meminfo for MemAvailable
    try {
      const { stdout } = await execAsync("cat /proc/meminfo");
      const lines = stdout.split("\n");

      let memAvailable = 0;
      for (const line of lines) {
        if (line.startsWith("MemAvailable:")) {
          memAvailable = parseInt(line.match(/(\d+)/)?.[1] || "0", 10) * 1024; // Convert KB to bytes
          break;
        }
      }

      if (memAvailable > 0) {
        const usedMemory = totalMemory - memAvailable;
        return {
          total: totalMemory,
          free: memAvailable,
          used: usedMemory,
          percent: Math.round((usedMemory / totalMemory) * 100),
        };
      }
    } catch {
      // Fallback to freemem if /proc/meminfo fails
    }
  }

  // Fallback for other platforms
  const freeMemory = freemem();
  const usedMemory = totalMemory - freeMemory;
  return {
    total: totalMemory,
    free: freeMemory,
    used: usedMemory,
    percent: Math.round((usedMemory / totalMemory) * 100),
  };
}

function emptyBattery(): BatteryInfo {
  return {
    hasBattery: false,
    charging: false,
    acPowered: false,
    percent: 0,
    timeRemainingMin: null,
    cycleCount: null,
    designCapacity: null,
    maxCapacity: null,
    healthPercent: null,
    condition: null,
    temperatureC: null,
  };
}

async function getBatteryInfo(): Promise<BatteryInfo> {
  const os = platform();

  if (os === "darwin") {
    try {
      const [pmsetOut, ioregOut] = await Promise.all([
        execAsync("pmset -g batt").then((r) => r.stdout).catch(() => ""),
        execAsync("ioreg -rn AppleSmartBattery").then((r) => r.stdout).catch(() => ""),
      ]);

      if (!pmsetOut && !ioregOut) return emptyBattery();

      // pmset output example:
      // Now drawing from 'Battery Power'
      //  -InternalBattery-0 (id=...)	87%; discharging; 5:12 remaining present: true
      const acPowered = /AC Power/i.test(pmsetOut);
      const chargingMatch = /\b(charging|charged|finishing charge)\b/i.exec(pmsetOut);
      const percentMatch = /(\d+)%/.exec(pmsetOut);
      const timeMatch = /(\d+):(\d{2})\s+remaining/i.exec(pmsetOut);

      const ioregNum = (key: string): number | null => {
        const m = new RegExp(`"${key}"\\s*=\\s*(\\d+)`).exec(ioregOut);
        return m ? parseInt(m[1], 10) : null;
      };
      const ioregStr = (key: string): string | null => {
        const m = new RegExp(`"${key}"\\s*=\\s*"([^"]+)"`).exec(ioregOut);
        return m ? m[1] : null;
      };

      const designCapacity = ioregNum("DesignCapacity");
      const maxCapacity = ioregNum("AppleRawMaxCapacity") ?? ioregNum("MaxCapacity");
      const cycleCount = ioregNum("CycleCount");
      const condition = ioregStr("BatteryHealth") ?? ioregStr("PermanentFailureStatus");
      const tempRaw = ioregNum("Temperature"); // hundredths of a degree C

      const healthPercent =
        designCapacity && maxCapacity && designCapacity > 0
          ? Math.min(100, Math.round((maxCapacity / designCapacity) * 100))
          : null;

      const hasBattery = percentMatch !== null || maxCapacity !== null;
      if (!hasBattery) return emptyBattery();

      return {
        hasBattery: true,
        charging: chargingMatch ? /charging|finishing charge/i.test(chargingMatch[0]) : false,
        acPowered,
        percent: percentMatch ? parseInt(percentMatch[1], 10) : 0,
        timeRemainingMin: timeMatch ? parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10) : null,
        cycleCount,
        designCapacity,
        maxCapacity,
        healthPercent,
        condition,
        temperatureC: tempRaw !== null ? Math.round(tempRaw / 10) / 10 : null,
      };
    } catch {
      return emptyBattery();
    }
  }

  if (os === "linux") {
    try {
      const { stdout: ls } = await execAsync("ls /sys/class/power_supply 2>/dev/null").catch(() => ({ stdout: "" }));
      const entries = ls.split("\n").map((s) => s.trim()).filter(Boolean);
      const batName = entries.find((e) => /^BAT/i.test(e));
      if (!batName) return emptyBattery();

      const base = `/sys/class/power_supply/${batName}`;
      const read = async (file: string): Promise<string | null> => {
        try {
          const { stdout } = await execAsync(`cat ${base}/${file}`);
          return stdout.trim();
        } catch {
          return null;
        }
      };

      const [status, capacity, energyFull, energyFullDesign, chargeFull, chargeFullDesign, cycles, timeToEmpty, timeToFull, temp, acOnline] =
        await Promise.all([
          read("status"),
          read("capacity"),
          read("energy_full"),
          read("energy_full_design"),
          read("charge_full"),
          read("charge_full_design"),
          read("cycle_count"),
          read("time_to_empty_now"),
          read("time_to_full_now"),
          read("temp"),
          execAsync("cat /sys/class/power_supply/A*/online 2>/dev/null").then((r) => r.stdout.trim()).catch(() => null),
        ]);

      const full = energyFull ?? chargeFull;
      const fullDesign = energyFullDesign ?? chargeFullDesign;
      const fullN = full ? parseInt(full, 10) : null;
      const fullDesignN = fullDesign ? parseInt(fullDesign, 10) : null;

      const healthPercent =
        fullN && fullDesignN && fullDesignN > 0
          ? Math.min(100, Math.round((fullN / fullDesignN) * 100))
          : null;

      return {
        hasBattery: true,
        charging: status === "Charging",
        acPowered: acOnline === "1" || status === "Charging" || status === "Full",
        percent: capacity ? parseInt(capacity, 10) : 0,
        timeRemainingMin: (() => {
          const raw = status === "Charging" ? (timeToFull ?? timeToEmpty) : timeToEmpty;
          return raw ? Math.round(parseInt(raw, 10) / 60) : null;
        })(),
        cycleCount: cycles ? parseInt(cycles, 10) : null,
        designCapacity: fullDesignN,
        maxCapacity: fullN,
        healthPercent,
        condition: null,
        temperatureC: temp ? parseInt(temp, 10) / 10 : null,
      };
    } catch {
      return emptyBattery();
    }
  }

  return emptyBattery();
}

async function getSystemMetrics(): Promise<SystemMetrics> {
  const cpuInfo = cpus();
  const memInfo = await getMemoryInfo();
  const processes = await getProcesses();
  const battery = await getBatteryInfo();

  return {
    hostname: hostname(),
    platform: platform(),
    arch: arch(),
    uptime: uptime(),
    loadAvg: loadavg(),
    cpuCount: cpuInfo.length,
    cpuModel: cpuInfo[0]?.model || "Unknown",
    cpuUsage: getCpuUsage(),
    totalMem: memInfo.total,
    freeMem: memInfo.free,
    usedMem: memInfo.used,
    memPercent: memInfo.percent,
    processes,
    processCount: processes.length,
    battery,
    timestamp: Date.now(),
  };
}

const server = Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/metrics") {
      const metrics = await getSystemMetrics();
      return new Response(JSON.stringify(metrics), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    if (url.pathname === "/api/environment") {
      // Return filtered environment variables for system diagnostics
      // Only expose safe, non-sensitive variables

      const safeVariables = [
        "PATH", "HOME", "USER", "SHELL", "TERM", "LANG", "LC_ALL",
        "EDITOR", "VISUAL", "PAGER", "TZ", "PWD", "OLDPWD",
        "HOSTNAME", "LOGNAME", "XDG_CONFIG_HOME", "XDG_DATA_HOME",
        "NODE_ENV", "RUST_BACKTRACE", "PYTHONDONTWRITEBYTECODE",
      ];

      const sensitivePatterns = [
        "KEY", "SECRET", "TOKEN", "PASSWORD", "CREDENTIAL",
        "AUTH", "PRIVATE", "API_KEY", "ACCESS_KEY",
      ];

      const isSensitive = (name: string): boolean => {
        return sensitivePatterns.some(pattern => name.includes(pattern));
      };

      const envVars = Object.entries(process.env)
        .filter(([key]) => safeVariables.includes(key) || key.startsWith("LC_") || key.startsWith("XDG_"))
        .map(([key, value]) => ({
          name: key,
          value: isSensitive(key) ? "[REDACTED]" : (value || ""),
        }));

      return new Response(JSON.stringify({ variables: envVars }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
});

console.log(`🖥️  btop server running at http://localhost:${server.port}`);

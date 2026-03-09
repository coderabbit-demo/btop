import { InfluxDB, Point, WriteApi, QueryApi } from "@influxdata/influxdb-client";
import { hostname } from "os";

// Configuration via environment variables
const INFLUX_URL = process.env.INFLUX_URL || "http://localhost:8086";
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || "";
const INFLUX_ORG = process.env.INFLUX_ORG || "btop";
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || "btop-metrics";

let writeApi: WriteApi | null = null;
let queryApi: QueryApi | null = null;
let enabled = false;

export function initInfluxDB(debug: (...msgs: unknown[]) => void): boolean {
  if (!INFLUX_TOKEN) {
    console.log("ℹ️  InfluxDB disabled: set INFLUX_TOKEN to enable timeseries storage");
    return false;
  }

  try {
    const client = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
    writeApi = client.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, "s");
    writeApi.useDefaultTags({ host: hostname() });
    queryApi = client.getQueryApi(INFLUX_ORG);
    enabled = true;
    debug("InfluxDB initialized", { url: INFLUX_URL, org: INFLUX_ORG, bucket: INFLUX_BUCKET });
    console.log(`📊 InfluxDB connected: ${INFLUX_URL} (org: ${INFLUX_ORG}, bucket: ${INFLUX_BUCKET})`);
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize InfluxDB:", error);
    return false;
  }
}

export function writeMetrics(metrics: {
  cpuUsage: { core: number; usage: number; user: number; system: number; idle: number }[];
  totalMem: number;
  usedMem: number;
  freeMem: number;
  memPercent: number;
  loadAvg: number[];
  processCount: number;
}): void {
  if (!enabled || !writeApi) return;

  const timestamp = new Date();

  // Write aggregate CPU usage
  const avgCpu = metrics.cpuUsage.length > 0
    ? metrics.cpuUsage.reduce((sum, c) => sum + c.usage, 0) / metrics.cpuUsage.length
    : 0;

  writeApi.writePoint(
    new Point("cpu")
      .floatField("usage_percent", avgCpu)
      .timestamp(timestamp)
  );

  // Write per-core CPU usage
  for (const core of metrics.cpuUsage) {
    writeApi.writePoint(
      new Point("cpu_core")
        .tag("core", String(core.core))
        .floatField("usage_percent", core.usage)
        .floatField("user_percent", core.user)
        .floatField("system_percent", core.system)
        .floatField("idle_percent", core.idle)
        .timestamp(timestamp)
    );
  }

  // Write memory metrics
  writeApi.writePoint(
    new Point("memory")
      .intField("total_bytes", metrics.totalMem)
      .intField("used_bytes", metrics.usedMem)
      .intField("free_bytes", metrics.freeMem)
      .floatField("usage_percent", metrics.memPercent)
      .timestamp(timestamp)
  );

  // Write load averages
  writeApi.writePoint(
    new Point("load")
      .floatField("avg_1m", metrics.loadAvg[0] || 0)
      .floatField("avg_5m", metrics.loadAvg[1] || 0)
      .floatField("avg_15m", metrics.loadAvg[2] || 0)
      .timestamp(timestamp)
  );

  // Write process count
  writeApi.writePoint(
    new Point("processes")
      .intField("count", metrics.processCount)
      .timestamp(timestamp)
  );

  // Flush writes (non-blocking)
  writeApi.flush().catch((err) => {
    console.error("InfluxDB write error:", err.message);
  });
}

export async function queryMetrics(
  measurement: string,
  range: string = "-1h",
  field: string = "usage_percent"
): Promise<{ time: string; value: number }[]> {
  if (!enabled || !queryApi) {
    return [];
  }

  const query = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: ${range})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "${field}")
      |> aggregateWindow(every: 10s, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;

  const results: { time: string; value: number }[] = [];

  return new Promise((resolve, reject) => {
    queryApi!.queryRows(query, {
      next(row, tableMeta) {
        const obj = tableMeta.toObject(row);
        results.push({
          time: obj._time as string,
          value: obj._value as number,
        });
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(results);
      },
    });
  });
}

export function isEnabled(): boolean {
  return enabled;
}

export async function closeInfluxDB(): Promise<void> {
  if (writeApi) {
    await writeApi.close();
  }
}

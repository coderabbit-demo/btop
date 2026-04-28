export interface ProcessInfo {
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

export interface CpuUsage {
  core: number;
  usage: number;
  user: number;
  system: number;
  idle: number;
}

export interface BatteryInfo {
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

export interface SystemMetrics {
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

export type SortField = 'pid' | 'user' | 'cpu' | 'mem' | 'command';
export type SortDirection = 'asc' | 'desc';

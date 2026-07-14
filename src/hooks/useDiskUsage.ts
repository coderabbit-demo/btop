import { useState, useEffect } from 'react';

export interface DiskInfo {
  filesystem: string;
  size: string;
  used: string;
  available: string;
  capacity: string;
  mount: string;
}

const API_URL = 'http://localhost:3001/api/disks';

export function useDiskUsage(refreshRate: number): DiskInfo[] {
  const [disks, setDisks] = useState<DiskInfo[]>([]);

  useEffect(() => {
    async function fetchDisks() {
      const response = await fetch(API_URL);
      const data = await response.json();
      setDisks(data.disks);
    }

    fetchDisks();
    setInterval(fetchDisks, refreshRate);
  }, []);

  return disks;
}

import { useEffect, useState } from 'react';

export interface ScanLog {
  id: string;
  scanType: string;
  tokensScanned: number;
  tokensPassed: number;
  tokensFailed: number;
  errorMessage: string | null;
  createdAt: string;
}

export function useScanLogs() {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/scan-logs?limit=20');
        if (response.ok) {
          const data = await response.json();
          setLogs(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch scan logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return { logs, loading };
}

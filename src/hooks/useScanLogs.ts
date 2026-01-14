import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScanLog } from '@/types/token';

export function useScanLogs() {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('scan_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setLogs(data || []);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  return { logs, loading };
}

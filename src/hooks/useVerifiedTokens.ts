import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VerifiedToken } from '@/types/token';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 100;

export function useVerifiedTokens() {
  const [tokens, setTokens] = useState<VerifiedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchTokens = useCallback(async (pageNum: number = page) => {
    try {
      setLoading(true);
      
      // Get total count first
      const { count, error: countError } = await supabase
        .from('verified_tokens')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Fetch paginated data
      const from = (pageNum - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('verified_tokens')
        .select('*')
        .order('launch_time', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setTokens(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum);
      fetchTokens(pageNum);
    }
  }, [totalPages, fetchTokens]);

  useEffect(() => {
    fetchTokens();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('verified-tokens-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'verified_tokens',
        },
        (payload) => {
          const newToken = payload.new as VerifiedToken;
          
          // Only add to current view if on first page
          if (page === 1) {
            setTokens((prev) => [newToken, ...prev.slice(0, ITEMS_PER_PAGE - 1)]);
          }
          
          setTotalCount((prev) => prev + 1);
          
          // Show notification for new token
          toast({
            title: "🚀 New Verified Token!",
            description: `${newToken.token_name} (${newToken.token_symbol}) passed all safety checks`,
          });

          // Play sound if enabled
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2AgICAgH17eXl9gISHiYmJh4WBfXp3d3p9gYWIi4uKiIWBfHh1dXh8gYaKjY6NioaBfHdzc3Z7gIaLj5CPjIiDfnl0c3V5foSJjpGQjouGgXx3dHV4fIKHjJCRkI2IhH95dXR2eX2DhpCRkI+MiYR/enZ0dXl+g4iMkJGQjYmEf3p2dXZ5fYKHjJCRkI2JhYB7d3V2eX2Ch4yQkZCNiYV/e3d1dnh8goeM');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch {}
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'verified_tokens',
        },
        (payload) => {
          const updatedToken = payload.new as VerifiedToken;
          setTokens((prev) =>
            prev.map((t) => (t.id === updatedToken.id ? updatedToken : t))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, page, fetchTokens]);

  return { 
    tokens, 
    loading, 
    error, 
    refetch: () => fetchTokens(page),
    page,
    totalPages,
    totalCount,
    goToPage,
    itemsPerPage: ITEMS_PER_PAGE
  };
}

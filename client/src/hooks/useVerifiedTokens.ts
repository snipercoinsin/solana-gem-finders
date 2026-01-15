import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface VerifiedToken {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  contractAddress: string;
  chain: string;
  launchTime: string;
  currentPrice: string | null;
  marketCap: string | null;
  liquidityUsd: string | null;
  volume24h: string | null;
  liquidityLocked: boolean;
  liquidityLockDurationMonths: number | null;
  ownershipRenounced: boolean;
  contractVerified: boolean;
  honeypotSafe: boolean;
  buyTax: string | null;
  sellTax: string | null;
  safetyScore: number;
  imageUrl: string | null;
  priceChange24h: string | null;
  dexscreenerUrl: string | null;
  solscanUrl: string | null;
  rugcheckUrl: string | null;
  twitterUrl: string | null;
  telegramUrl: string | null;
  websiteUrl: string | null;
  safetyReasons: string[] | null;
  createdAt: string;
  updatedAt: string;
}

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
      
      const response = await fetch(`/api/tokens?page=${pageNum}&limit=${ITEMS_PER_PAGE}`);
      if (!response.ok) throw new Error('Failed to fetch tokens');
      
      const data = await response.json();
      setTokens(data.tokens || []);
      setTotalCount(data.total || 0);
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
    
    const interval = setInterval(() => {
      fetchTokens(page);
    }, 30000);

    return () => clearInterval(interval);
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

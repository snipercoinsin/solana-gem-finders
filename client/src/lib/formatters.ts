export function formatPrice(price: number | string | null): string {
  if (price === null || price === undefined) return '-';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '-';
  if (num < 0.00001) return `$${num.toExponential(2)}`;
  if (num < 1) return `$${num.toFixed(6)}`;
  if (num < 1000) return `$${num.toFixed(2)}`;
  return `$${formatCompact(num)}`;
}

export function formatCompact(num: number | string | null): string {
  if (num === null || num === undefined) return '-';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '-';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

export function formatTimeAgo(date: string | null | undefined): string {
  if (!date) return 'Just now';
  const now = new Date();
  const past = new Date(date);
  if (isNaN(past.getTime())) return 'Just now';
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

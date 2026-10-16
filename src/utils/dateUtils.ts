export function formatDate(dateStr: string | Date | number): string {
  if (!dateStr) return 'N/A';
  const d = typeof dateStr === 'number' 
    ? new Date(dateStr > 1e11 ? dateStr : dateStr * 1000) 
    : new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string | Date | number): string {
  if (!dateStr) return 'N/A';
  const d = typeof dateStr === 'number'
    ? new Date(dateStr > 1e11 ? dateStr : dateStr * 1000)
    : new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(d);
}

export function getISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getISODateString(d);
}

export function getDaysBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const curr = new Date(start);
  const last = new Date(end);
  
  while (curr <= last) {
    dates.push(getISODateString(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/**
 * Format bytes into human-readable strings (e.g., "14.2 MB", "1.5 GB").
 */
export function formatBytes(
  bytes: number | string | undefined | null,
  decimals: number = 1,
): string {
  const num = typeof bytes === "string" ? parseFloat(bytes) : Number(bytes);
  if (!num || isNaN(num) || num <= 0 || !Number.isFinite(num)) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(num) / Math.log(k));
  if (i <= 0) return `${num} B`;

  return `${parseFloat((num / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format network transfer speeds (e.g., "4.2 MB/s", "850 KB/s").
 */
export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0 || !Number.isFinite(bytesPerSec)) return "";
  const mb = bytesPerSec / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB/s`;
  const kb = bytesPerSec / 1024;
  return `${kb.toFixed(0)} KB/s`;
}

/**
 * Format remaining seconds into a readable ETA (e.g., "45s", "2m 10s").
 */
export function formatEta(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "--";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const remainingSecs = Math.round(seconds % 60);
  if (mins < 60) return `${mins}m ${remainingSecs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Calculate percentage clamped between 0 and 100.
 */
export function calculatePercent(current: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}

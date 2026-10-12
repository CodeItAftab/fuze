export function formatBytes(bytes: number | string | undefined | null): string {
  const num = typeof bytes === "string" ? parseFloat(bytes) : bytes;
  if (!num || isNaN(num) || num <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

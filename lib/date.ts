export function toDateString(d: Date = new Date()): string {
  // Return YYYY-MM-DD in local time
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isBeforeDate(a: string, b: string): boolean {
  // Compare YYYY-MM-DD strings lexicographically
  return a < b;
}

export function isSameDate(a: string, b: string): boolean {
  return a === b;
}

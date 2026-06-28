export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function toTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function addMinutes(time: string, amount: number) {
  return toTime(toMinutes(time) + amount);
}

export function overlaps(a: { start: string; end: string }, b: { start: string; end: string }) {
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

export function weekdayOf(date: string) {
  return new Date(`${date}T12:00:00`).getDay();
}

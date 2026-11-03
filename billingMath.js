export function parseRateToCents(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim().replace(",", ".");
  const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(text);
  return match ? Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0")) : null;
}

function secondsFromTime(value) {
  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.0+)?)?$/.exec(String(value || ""));
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);
  if (hours > 24 || minutes > 59 || seconds > 59 || (hours === 24 && (minutes || seconds))) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

export function summarizeMonth(sessions, year, month, rateCents) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const rows = sessions.filter(session => session.type === "class" && session.date?.startsWith(prefix))
    .slice().sort((a, b) => `${a.date}${a.start_time}${a.id}`.localeCompare(`${b.date}${b.start_time}${b.id}`))
    .map(session => {
      const start = secondsFromTime(session.start_time);
      const end = secondsFromTime(session.end_time);
      const duration = start !== null && end !== null && end > start ? end - start : null;
      return { session, duration, amountCents: duration !== null && rateCents !== null ? Math.round(duration * rateCents / 3600) : null };
    });
  const invalid = rows.some(row => row.duration === null);
  return {
    rows,
    invalid,
    seconds: invalid ? null : rows.reduce((total, row) => total + row.duration, 0),
    amountCents: invalid || rateCents === null ? null : rows.reduce((total, row) => total + row.amountCents, 0),
  };
}


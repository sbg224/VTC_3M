const BUSINESS_TIME_ZONE = 'Europe/Paris';

const formatterCache = new Map();

function getFormatter(timeZone) {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(timeZone, new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }));
  }
  return formatterCache.get(timeZone);
}

function getZonedParts(epochMs, timeZone) {
  const parts = getFormatter(timeZone).formatToParts(new Date(epochMs));
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function parseLocalDateTime(dateValue, timeValue) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue || '');
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue || '');
  if (!dateMatch || !timeMatch) return null;

  const target = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };

  const check = new Date(Date.UTC(target.year, target.month - 1, target.day));
  if (
    target.hour > 23
    || target.minute > 59
    || check.getUTCFullYear() !== target.year
    || check.getUTCMonth() !== target.month - 1
    || check.getUTCDate() !== target.day
  ) {
    return null;
  }
  return target;
}

function getOffsetMs(epochMs, timeZone) {
  const parts = getZonedParts(epochMs, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - Math.floor(epochMs / 1000) * 1000;
}

function sameLocalMinute(parts, target) {
  return parts.year === target.year
    && parts.month === target.month
    && parts.day === target.day
    && parts.hour === target.hour
    && parts.minute === target.minute;
}

/**
 * Retourne tous les instants correspondant au créneau local. Deux instants
 * sont possibles lors du retour à l'heure d'hiver, aucun lors d'une heure
 * inexistante au passage à l'heure d'été.
 */
function getPossibleInstants(dateValue, timeValue, timeZone = BUSINESS_TIME_ZONE) {
  const target = parseLocalDateTime(dateValue, timeValue);
  if (!target) return [];

  const wallClockUtc = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
  );
  const oneDay = 24 * 60 * 60 * 1000;
  const offsets = new Set([
    getOffsetMs(wallClockUtc - oneDay, timeZone),
    getOffsetMs(wallClockUtc, timeZone),
    getOffsetMs(wallClockUtc + oneDay, timeZone),
  ]);

  return [...offsets]
    .map((offset) => wallClockUtc - offset)
    .filter((epochMs) => sameLocalMinute(getZonedParts(epochMs, timeZone), target))
    .filter((epochMs, index, values) => values.indexOf(epochMs) === index)
    .sort((a, b) => a - b);
}

function validateReservationDateTime(
  dateValue,
  timeValue,
  { now = new Date(), timeZone = BUSINESS_TIME_ZONE } = {},
) {
  const instants = getPossibleInstants(dateValue, timeValue, timeZone);
  if (instants.length === 0) {
    throw new Error('Date ou heure invalide dans le fuseau Europe/Paris.');
  }

  // Lors d'une heure répétée en automne, le créneau reste acceptable tant
  // qu'au moins l'une de ses deux occurrences est encore future.
  if (instants.every((instant) => instant <= now.getTime())) {
    throw new Error('La date et l\'heure de prise en charge doivent être dans le futur.');
  }
  return true;
}

module.exports = {
  BUSINESS_TIME_ZONE,
  getPossibleInstants,
  validateReservationDateTime,
};

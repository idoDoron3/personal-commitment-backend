module.exports = function formatReadableDate(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleString('en-US', {
    weekday: 'long',      // Saturday
    year: 'numeric',      // 2025
    month: 'long',        // May
    day: 'numeric',       // 18
    hour: '2-digit',
    minute: '2-digit',
    hour12: false         // 24-hour format
  });
};

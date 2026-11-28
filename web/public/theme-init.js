// Applies the saved theme before first paint so a pinned Light or Dark choice does not flash. Kept as a
// separate file because the Content-Security-Policy forbids inline scripts. Mirrors src/theme/theme.ts.
try {
  var saved = window.localStorage.getItem("samska-theme");
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
} catch (error) {
  // Storage is unavailable; the system setting applies.
}

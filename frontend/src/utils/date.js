export function relativeDate(dateStr) {
  const d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)     return "à l'instant";
  if (diff < 3600)   return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400)  return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

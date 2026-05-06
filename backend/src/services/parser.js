export function extractWikiLinks(content) {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);
  return [...matches].map(m => m[1].trim());
}

export function extractTags(content) {
  const matches = content.matchAll(/#([a-zA-Z0-9_-]+)/g);
  return [...new Set([...matches].map(m => m[1].toLowerCase()))];
}

const STOP_WORDS = new Set([
  'pour','dans','avec','sont','mais','donc','nous','vous','cette','être',
  'avoir','faire','plus','tout','bien','aussi','comme','même','très','peut',
  'that','this','with','from','have','will','your','been','they','what',
  'when','where','which','their','there','about','after','before','other',
  'than','then','some','such','into','only','over','also','just','more',
]);

export function extractKeywords(text) {
  const words = text.toLowerCase().match(/\b[a-zA-ZÀ-ÿ]{5,}\b/g) ?? [];
  return new Set(words.filter(w => !STOP_WORDS.has(w)));
}

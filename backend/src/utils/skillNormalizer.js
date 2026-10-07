/**
 * Deterministic Skill Normalizer
 * 
 * Maps raw or varied skill strings (e.g., "JS", "javascript", "NodeJS") to
 * standardized canonical skill names and categories according to the taxonomy.
 * 
 * Deterministic only — does NOT invoke LLM or probabilistic reasoning.
 */

const { SKILL_TAXONOMY } = require('../data/skills/skillTaxonomy');

// Build fast lookup index from lowercase alias/name -> canonical entry
const SKILL_LOOKUP_MAP = new Map();

for (const entry of SKILL_TAXONOMY) {
  // Map canonical name
  const canonicalKey = entry.canonicalName.toLowerCase().trim();
  SKILL_LOOKUP_MAP.set(canonicalKey, entry);

  // Map each alias
  if (Array.isArray(entry.aliases)) {
    for (const alias of entry.aliases) {
      const aliasKey = alias.toLowerCase().trim();
      SKILL_LOOKUP_MAP.set(aliasKey, entry);
    }
  }
}

/**
 * Clean and normalize a raw skill name
 * @param {string} rawSkill 
 * @returns {{ canonicalName: string, category: string, isKnown: boolean }}
 */
function normalizeSkill(rawSkill) {
  if (!rawSkill || typeof rawSkill !== 'string') {
    return {
      canonicalName: '',
      category: 'tools',
      isKnown: false,
    };
  }

  const trimmed = rawSkill.trim();
  const lowerKey = trimmed.toLowerCase();

  // 1. Direct exact or lowercase match
  if (SKILL_LOOKUP_MAP.has(lowerKey)) {
    const matched = SKILL_LOOKUP_MAP.get(lowerKey);
    return {
      canonicalName: matched.canonicalName,
      category: matched.category,
      isKnown: true,
    };
  }

  // 2. Clean common punctuation separators (e.g. "node-js" -> "node js")
  const sanitized = lowerKey.replace(/[-_.]/g, ' ').replace(/\s+/g, ' ').trim();
  if (SKILL_LOOKUP_MAP.has(sanitized)) {
    const matched = SKILL_LOOKUP_MAP.get(sanitized);
    return {
      canonicalName: matched.canonicalName,
      category: matched.category,
      isKnown: true,
    };
  }

  // 3. Fallback: return cleaned original representation
  return {
    canonicalName: trimmed,
    category: 'tools',
    isKnown: false,
  };
}

/**
 * Normalizes an array of skills, deduping by canonical name
 * @param {Array<string|object>} skillsList
 * @returns {Array<string>} list of unique canonical names
 */
function normalizeSkillList(skillsList) {
  if (!Array.isArray(skillsList)) return [];

  const seen = new Set();
  const result = [];

  for (const item of skillsList) {
    const rawName = typeof item === 'string' ? item : item?.skillName || item?.name || item?.skill;
    if (!rawName) continue;

    const { canonicalName } = normalizeSkill(rawName);
    if (canonicalName && !seen.has(canonicalName.toLowerCase())) {
      seen.add(canonicalName.toLowerCase());
      result.push(canonicalName);
    }
  }

  return result;
}

module.exports = {
  normalizeSkill,
  normalizeSkillList,
  SKILL_TAXONOMY,
};

/**
 * Official Matti Themes Configuration
 * 10 main themes for youth conversations (ages 12-21)
 */

export const MATTI_THEMES = [
  'School',
  'Vrienden',
  'Thuis',
  'Gevoelens',
  'Liefde',
  'Vrije Tijd',
  'Toekomst',
  'Jezelf',
  'Pesten',
  'Gewoon kletsen',
] as const;

export type MattiTheme = typeof MATTI_THEMES[number];

/**
 * Sub-themes under Pesten main theme
 */
export const PESTEN_SUB_THEMES = [
  'Pesten (persoonlijk/op school)',
  'Cyberpesten (online/social media)',
] as const;

export type PestenSubTheme = typeof PESTEN_SUB_THEMES[number];

/**
 * Theme descriptions for UI tooltips
 */
export const THEME_DESCRIPTIONS: Record<MattiTheme, string> = {
  'School': 'Gesprekken over school, huiswerk, cijfers, docenten en studie',
  'Vrienden': 'Gesprekken over vriendschappen, sociale contacten en relaties met leeftijdsgenoten',
  'Thuis': 'Gesprekken over thuissituatie, ouders, broers/zussen en gezin',
  'Gevoelens': 'Gesprekken over emoties, stemmingen en mentale gezondheid',
  'Liefde': 'Gesprekken over romantische relaties, verliefdheid en intimiteit',
  'Vrije Tijd': 'Gesprekken over hobbies, sport, gaming en vrijetijdsbesteding',
  'Toekomst': 'Gesprekken over toekomstplannen, carrière en levensdoelen',
  'Jezelf': 'Gesprekken over identiteit, zelfbeeld en persoonlijke ontwikkeling',
  'Pesten': 'Gesprekken over pesten op school, online pesten (cyberpesten) en pestgedrag',
  'Gewoon kletsen': 'Informele gesprekken zonder specifiek thema',
};

/**
 * Theme colors for visualizations
 */
export const THEME_COLORS: Record<MattiTheme, string> = {
  'School': '#3b82f6',      // blue
  'Vrienden': '#10b981',    // green
  'Thuis': '#f59e0b',       // amber
  'Gevoelens': '#ef4444',   // red
  'Liefde': '#ec4899',      // pink
  'Vrije Tijd': '#8b5cf6',  // purple
  'Toekomst': '#06b6d4',    // cyan
  'Jezelf': '#84cc16',      // lime
  'Pesten': '#dc2626',      // dark red (alert color for serious topic)
  'Gewoon kletsen': '#6b7280', // gray
};

/**
 * Check if a theme string matches an official Matti theme
 */
export function isMattiTheme(theme: string): theme is MattiTheme {
  return MATTI_THEMES.includes(theme as MattiTheme);
}

/**
 * Normalize theme names from analytics data
 */
export function normalizeTheme(theme: string): MattiTheme | null {
  const normalized = theme.trim();
  
  // Direct match
  if (isMattiTheme(normalized)) {
    return normalized;
  }
  
  // Case-insensitive match
  const found = MATTI_THEMES.find(
    t => t.toLowerCase() === normalized.toLowerCase()
  );
  
  return found || null;
}

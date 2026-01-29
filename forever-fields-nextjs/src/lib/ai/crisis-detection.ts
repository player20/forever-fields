/**
 * Crisis Detection System
 *
 * Detects potential crisis situations in AI companion conversations.
 * Uses a tiered approach to balance user autonomy with safety.
 *
 * Tier 1: Immediate crisis - show resources immediately
 * Tier 2: High concern - offer resources gently
 * Tier 3: Monitor - log for pattern detection
 */

export type CrisisTier = 0 | 1 | 2 | 3;

export type CrisisAction = "none" | "log" | "offer_resources" | "show_resources";

export interface CrisisResult {
  tier: CrisisTier;
  matchedPatterns: string[];
  action: CrisisAction;
  suggestedResponse?: string;
}

// Tier 1: Immediate crisis (show resources immediately)
const TIER_1_PATTERNS: RegExp[] = [
  /\b(kill|end|hurt)\s*(myself|my\s*life)\b/i,
  /\bsuicid/i,
  /\bwant\s*to\s*die\b/i,
  /\bend\s*it\s*all\b/i,
  /\bno\s*reason\s*to\s*live\b/i,
  /\btake\s*my\s*(own\s*)?life\b/i,
  /\bdon'?t\s*want\s*to\s*(be\s*here|exist|live)\b/i,
  /\bbetter\s*off\s*(dead|without\s*me)\b/i,
];

// Tier 2: High concern (offer resources gently)
const TIER_2_PATTERNS: RegExp[] = [
  /\bcan'?t\s*go\s*on\b/i,
  /\bjoin\s*(them|him|her)\b/i,
  /\bbe\s*with\s*(them|him|her)\s*(again|soon)\b/i,
  /\bwish\s*i\s*was\s*dead\b/i,
  /\bgive\s*up\b/i,
  /\bno\s*point\b/i,
  /\bcan'?t\s*do\s*this\s*(anymore)?\b/i,
  /\bnothing\s*matters\b/i,
  /\bwhat'?s\s*the\s*point\b/i,
  /\bcan'?t\s*take\s*(it|this)\s*(anymore)?\b/i,
];

// Tier 3: Monitor (log for pattern detection)
const TIER_3_PATTERNS: RegExp[] = [
  /\bso\s*(sad|lonely|empty|lost)\b/i,
  /\bnobody\s*(cares|understands)\b/i,
  /\ball\s*alone\b/i,
  /\bmiss\s*(them|him|her)\s*so\s*much\b/i,
  /\bcan'?t\s*stop\s*crying\b/i,
  /\bfeeling\s*(hopeless|worthless)\b/i,
  /\bdon'?t\s*know\s*how\s*to\s*(cope|handle)\b/i,
  /\bfalling\s*apart\b/i,
];

/**
 * Detect crisis indicators in a message
 */
export function detectCrisis(message: string): CrisisResult {
  // Check Tier 1 first (most urgent)
  for (const pattern of TIER_1_PATTERNS) {
    if (pattern.test(message)) {
      return {
        tier: 1,
        matchedPatterns: [pattern.source],
        action: "show_resources",
        suggestedResponse: getCrisisResponse(1),
      };
    }
  }

  // Check Tier 2
  for (const pattern of TIER_2_PATTERNS) {
    if (pattern.test(message)) {
      return {
        tier: 2,
        matchedPatterns: [pattern.source],
        action: "offer_resources",
        suggestedResponse: getCrisisResponse(2),
      };
    }
  }

  // Check Tier 3
  const tier3Matches: string[] = [];
  for (const pattern of TIER_3_PATTERNS) {
    if (pattern.test(message)) {
      tier3Matches.push(pattern.source);
    }
  }

  if (tier3Matches.length > 0) {
    return {
      tier: 3,
      matchedPatterns: tier3Matches,
      action: "log",
    };
  }

  return {
    tier: 0,
    matchedPatterns: [],
    action: "none",
  };
}

/**
 * Get appropriate response for crisis tier
 */
function getCrisisResponse(tier: CrisisTier): string {
  switch (tier) {
    case 1:
      return "I'm concerned about what you've shared. Please know that you're not alone, and there are people who want to help. Would you like me to share some resources that can provide immediate support?";
    case 2:
      return "It sounds like you're going through an incredibly difficult time. Grief can be overwhelming, and it's okay to need extra support. There are people who understand and want to help.";
    default:
      return "";
  }
}

/**
 * Crisis resources by country
 */
export interface CrisisResource {
  name: string;
  action: string;
  phone?: string;
  text?: string;
  url?: string;
  available: string;
  isPrimary?: boolean;
}

export const CRISIS_RESOURCES: Record<string, CrisisResource[]> = {
  US: [
    {
      name: "988 Suicide & Crisis Lifeline",
      action: "Call or text 988",
      phone: "988",
      text: "988",
      url: "https://988lifeline.org",
      available: "24/7",
      isPrimary: true,
    },
    {
      name: "Crisis Text Line",
      action: "Text HOME to 741741",
      text: "HOME to 741741",
      url: "https://www.crisistextline.org",
      available: "24/7",
    },
    {
      name: "National Alliance on Mental Illness",
      action: "Call 1-800-950-6264",
      phone: "1-800-950-6264",
      url: "https://www.nami.org",
      available: "Mon-Fri 10am-10pm ET",
    },
    {
      name: "GriefShare",
      action: "Find a local support group",
      url: "https://www.griefshare.org",
      available: "Check local listings",
    },
  ],
  UK: [
    {
      name: "Samaritans",
      action: "Call 116 123",
      phone: "116 123",
      url: "https://www.samaritans.org",
      available: "24/7",
      isPrimary: true,
    },
    {
      name: "SHOUT",
      action: "Text SHOUT to 85258",
      text: "SHOUT to 85258",
      url: "https://giveusashout.org",
      available: "24/7",
    },
  ],
  CA: [
    {
      name: "Talk Suicide Canada",
      action: "Call 1-833-456-4566",
      phone: "1-833-456-4566",
      url: "https://talksuicide.ca",
      available: "24/7",
      isPrimary: true,
    },
    {
      name: "Crisis Text Line",
      action: "Text HOME to 686868",
      text: "HOME to 686868",
      available: "24/7",
    },
  ],
  AU: [
    {
      name: "Lifeline Australia",
      action: "Call 13 11 14",
      phone: "13 11 14",
      url: "https://www.lifeline.org.au",
      available: "24/7",
      isPrimary: true,
    },
    {
      name: "Beyond Blue",
      action: "Call 1300 22 4636",
      phone: "1300 22 4636",
      url: "https://www.beyondblue.org.au",
      available: "24/7",
    },
  ],
  DEFAULT: [
    {
      name: "International Association for Suicide Prevention",
      action: "Find resources for your country",
      url: "https://www.iasp.info/resources/Crisis_Centres/",
      available: "See website",
      isPrimary: true,
    },
    {
      name: "GriefShare",
      action: "Find a support group",
      url: "https://www.griefshare.org",
      available: "Check local listings",
    },
  ],
};

/**
 * Get crisis resources for a region
 */
export function getCrisisResources(
  countryCode: string = "US"
): CrisisResource[] {
  return CRISIS_RESOURCES[countryCode] || CRISIS_RESOURCES.DEFAULT;
}

/**
 * Healthy grieving tips to share periodically
 */
export const GRIEF_TIPS: string[] = [
  "It's okay to feel a mix of emotions. Grief isn't linear, and healing takes time.",
  "Many people find journaling helps process difficult feelings.",
  "Connecting with others who understand can be healing.",
  "Taking care of your physical health supports emotional healing.",
  "There's no 'right' way to grieve. Your journey is unique.",
  "It's okay to have good days. Joy and grief can coexist.",
  "Honoring your loved one's memory in meaningful ways can bring comfort.",
  "Grief can come in waves. Be gentle with yourself when it feels overwhelming.",
  "Seeking professional support is a sign of strength, not weakness.",
  "Small acts of self-care can make a big difference during difficult times.",
];

/**
 * Get a random grief tip
 */
export function getRandomGriefTip(): string {
  return GRIEF_TIPS[Math.floor(Math.random() * GRIEF_TIPS.length)];
}

/**
 * Check if a message appears to dismiss crisis resources
 */
export function isDismissingCrisis(message: string): boolean {
  const dismissalPatterns = [
    /\bjust\s*(kidding|joking)\b/i,
    /\bnevermind\b/i,
    /\bforget\s*(it|that)\b/i,
    /\bi('?m)?\s*fine\b/i,
    /\bdon'?t\s*worry\b/i,
  ];

  return dismissalPatterns.some((pattern) => pattern.test(message));
}

/**
 * Analyze conversation for patterns over time
 */
export interface ConversationAnalysis {
  crisisEventCount: number;
  averageSentiment: number; // -1 to 1
  concernLevel: "low" | "moderate" | "high";
  shouldSuggestBreak: boolean;
  shouldShowResources: boolean;
}

export function analyzeConversation(
  messages: Array<{ role: string; content: string; crisisResult?: CrisisResult }>
): ConversationAnalysis {
  const userMessages = messages.filter((m) => m.role === "user");
  const crisisEvents = userMessages.filter(
    (m) => m.crisisResult && m.crisisResult.tier > 0
  );

  // Simple sentiment analysis (placeholder - would use real NLP in production)
  const concernLevel =
    crisisEvents.length > 2
      ? "high"
      : crisisEvents.length > 0
        ? "moderate"
        : "low";

  return {
    crisisEventCount: crisisEvents.length,
    averageSentiment: 0, // Would calculate from actual sentiment scores
    concernLevel,
    shouldSuggestBreak: userMessages.length > 15,
    shouldShowResources: crisisEvents.some(
      (m) => m.crisisResult && m.crisisResult.tier <= 2
    ),
  };
}

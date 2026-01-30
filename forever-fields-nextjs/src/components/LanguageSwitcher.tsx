"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

const locales = ["en", "es", "fr", "de", "pt", "vi"] as const;
type Locale = (typeof locales)[number];

const languageNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  vi: "Tiếng Việt",
};

// Short codes for compact display
const languageCodes: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
  pt: "PT",
  vi: "VI",
};

interface LanguageSwitcherProps {
  variant?: "dropdown" | "compact";
  className?: string;
}

export function LanguageSwitcher({
  variant = "dropdown",
  className = "",
}: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();

  const handleChange = (newLocale: string) => {
    // Store preference in cookie for server-side detection (1 year expiry)
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;

    // Refresh the page to apply the new locale
    router.refresh();
  };

  if (variant === "compact") {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={locale}
          onChange={(e) => handleChange(e.target.value)}
          className="appearance-none bg-transparent border-none text-sm font-medium cursor-pointer focus:outline-none focus:ring-0 pr-4"
          aria-label="Select language"
        >
          {locales.map((loc) => (
            <option key={loc} value={loc}>
              {languageCodes[loc]}
            </option>
          ))}
        </select>
        <Globe className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-body" />
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 text-gray-body" />
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-white border border-gray-light rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-dark cursor-pointer hover:border-sage focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
        aria-label="Select language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {languageNames[loc]}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-body"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

// Export for use in other components
export { locales, languageNames, languageCodes };
export type { Locale };

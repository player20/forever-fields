import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const locales = ["en", "es", "fr", "de", "pt", "vi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

// Language names for display
export const languageNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  vi: "Tiếng Việt",
};

export default getRequestConfig(async () => {
  // 1. Check for user's saved preference in cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;

  if (localeCookie && locales.includes(localeCookie)) {
    return {
      locale: localeCookie,
      messages: (await import(`../../messages/${localeCookie}.json`)).default,
    };
  }

  // 2. Detect from Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  // Parse Accept-Language header to find best match
  // Format: "en-US,en;q=0.9,es;q=0.8"
  const browserLocales = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code] = lang.trim().split(";");
      return code.split("-")[0].toLowerCase();
    })
    .filter((code) => locales.includes(code as Locale));

  const detectedLocale = (browserLocales[0] as Locale) || defaultLocale;

  return {
    locale: detectedLocale,
    messages: (await import(`../../messages/${detectedLocale}.json`)).default,
  };
});

/**
 * Custom hook for responsive media queries
 */

import { useEffect, useState } from 'react';

/**
 * Hook to track if a media query matches
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is defined (SSR safety)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Check if window is defined (SSR safety)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Update the state if the query matches initially
    setMatches(mediaQuery.matches);

    // Define the event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the event listener
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Clean up
    return () => {
      // Modern browsers
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Preset media queries for common breakpoints
 */
export const MEDIA_QUERIES = {
  mobile: '(max-width: 640px)',
  tablet: '(min-width: 641px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  largeDesktop: '(min-width: 1440px)',

  // Tailwind CSS breakpoints
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',

  // Feature queries
  touch: '(hover: none) and (pointer: coarse)',
  hover: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
  highContrast: '(prefers-contrast: high)',

  // Orientation
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
} as const;

/**
 * Hook to get current device type
 * @returns Current device type based on viewport width
 */
export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
  const isTablet = useMediaQuery(MEDIA_QUERIES.tablet);

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

/**
 * Hook to check multiple media queries at once
 * @param queries - Object with named media queries
 * @returns Object with boolean values for each query
 *
 * @example
 * const { isMobile, isDark } = useMediaQueries({
 *   isMobile: MEDIA_QUERIES.mobile,
 *   isDark: MEDIA_QUERIES.darkMode
 * });
 */
export function useMediaQueries<T extends Record<string, string>>(
  queries: T
): Record<keyof T, boolean> {
  const results: any = {};

  for (const key in queries) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useMediaQuery(queries[key]);
  }

  return results;
}
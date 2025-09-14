import { useMemo, useCallback } from 'react';
import { Command } from '@/types/command.types';

/**
 * Fuzzy search algorithm optimized for command palette
 */
export interface SearchOptions {
  threshold?: number; // 0-1, lower is more strict
  includeScore?: boolean;
  keys?: string[]; // Which fields to search
  minMatchCharLength?: number;
}

interface SearchResult {
  item: Command;
  score: number;
  matches?: Array<{
    key: string;
    indices: Array<[number, number]>;
  }>;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Fuzzy match with character positions
 */
function fuzzyMatch(pattern: string, text: string): { matched: boolean; score: number; indices: Array<[number, number]> } {
  const patternLower = pattern.toLowerCase();
  const textLower = text.toLowerCase();

  let patternIdx = 0;
  let textIdx = 0;
  let score = 0;
  const indices: Array<[number, number]> = [];
  let matchStart = -1;
  let consecutiveMatches = 0;

  while (patternIdx < patternLower.length && textIdx < textLower.length) {
    if (patternLower[patternIdx] === textLower[textIdx]) {
      if (matchStart === -1) {
        matchStart = textIdx;
      }

      // Bonus for consecutive matches
      consecutiveMatches++;
      score += consecutiveMatches * 2;

      // Bonus for matching at word boundaries
      if (textIdx === 0 || /\W/.test(text[textIdx - 1])) {
        score += 10;
      }

      // Bonus for exact case match
      if (pattern[patternIdx] === text[textIdx]) {
        score += 2;
      }

      patternIdx++;
      textIdx++;

      // If we're at the end of pattern or text, or next char doesn't match
      if (patternIdx === patternLower.length ||
          textIdx === textLower.length ||
          patternLower[patternIdx] !== textLower[textIdx]) {
        indices.push([matchStart, textIdx - 1]);
        matchStart = -1;
        consecutiveMatches = 0;
      }
    } else {
      if (matchStart !== -1) {
        indices.push([matchStart, textIdx - 1]);
        matchStart = -1;
      }
      consecutiveMatches = 0;
      textIdx++;
      score -= 1; // Penalty for gaps
    }
  }

  const matched = patternIdx === patternLower.length;

  if (matched) {
    // Bonus for shorter text (more relevant)
    score += Math.max(0, 50 - text.length);

    // Bonus for exact match
    if (patternLower === textLower) {
      score += 100;
    }

    // Bonus for starting with pattern
    if (textLower.startsWith(patternLower)) {
      score += 50;
    }
  }

  return { matched, score: Math.max(0, score), indices };
}

/**
 * Search through commands with various algorithms
 */
function searchCommands(
  commands: Command[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const {
    threshold = 0.6,
    includeScore = true,
    keys = ['name', 'description', 'searchTerms'],
    minMatchCharLength = 2
  } = options;

  if (!query || query.length < minMatchCharLength) {
    return commands.map(item => ({ item, score: 0 }));
  }

  const results: SearchResult[] = [];

  for (const command of commands) {
    let totalScore = 0;
    const matches: SearchResult['matches'] = [];
    let hasMatch = false;

    // Search through specified keys
    for (const key of keys) {
      let value: string | string[] | undefined;

      if (key === 'searchTerms') {
        value = command.searchTerms;
      } else {
        value = (command as any)[key];
      }

      if (!value) continue;

      // Handle array values (like searchTerms)
      const values = Array.isArray(value) ? value : [value];

      for (const val of values) {
        const { matched, score, indices } = fuzzyMatch(query, val);

        if (matched) {
          hasMatch = true;
          totalScore += score;

          // Weight different fields differently
          if (key === 'name') {
            totalScore *= 2; // Name matches are more important
          } else if (key === 'searchTerms') {
            totalScore *= 1.5; // Search terms are quite relevant
          }

          if (includeScore) {
            matches.push({ key, indices });
          }
        }
      }
    }

    // Additional scoring factors
    if (hasMatch) {
      // Boost recently used commands
      if (command.recent) {
        totalScore *= 1.5;
      }

      // Boost favorite commands
      if (command.favorite) {
        totalScore *= 1.3;
      }

      // Boost by usage frequency
      totalScore += Math.min(command.usage || 0, 20);

      // Normalize score
      const normalizedScore = Math.min(1, totalScore / 200);

      if (normalizedScore >= threshold) {
        results.push({
          item: command,
          score: normalizedScore,
          matches: includeScore ? matches : undefined
        });
      }
    }
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Custom hook for command search with fuzzy matching
 */
export default function useCommandSearch(
  commands: Command[],
  query: string,
  options?: SearchOptions
) {
  // Memoize search results
  const searchResults = useMemo(() => {
    if (!query || query.trim().length === 0) {
      // Return pinned and recent commands when no query
      const pinnedAndRecent = commands.filter(cmd => cmd.favorite || cmd.recent);
      return pinnedAndRecent.map(item => ({ item, score: 1 }));
    }

    return searchCommands(commands, query, options);
  }, [commands, query, options]);

  // Get highlighted text for display
  const getHighlightedText = useCallback((text: string, indices: Array<[number, number]>) => {
    if (!indices || indices.length === 0) return text;

    const parts: Array<{ text: string; highlighted: boolean }> = [];
    let lastIndex = 0;

    for (const [start, end] of indices) {
      // Add non-highlighted part
      if (lastIndex < start) {
        parts.push({
          text: text.substring(lastIndex, start),
          highlighted: false
        });
      }

      // Add highlighted part
      parts.push({
        text: text.substring(start, end + 1),
        highlighted: true
      });

      lastIndex = end + 1;
    }

    // Add remaining non-highlighted part
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        highlighted: false
      });
    }

    return parts;
  }, []);

  // Get suggestions based on partial input
  const getSuggestions = useCallback((partialQuery: string, limit = 5): Command[] => {
    if (!partialQuery) return [];

    const results = searchCommands(commands, partialQuery, {
      ...options,
      threshold: 0.3 // Lower threshold for suggestions
    });

    return results.slice(0, limit).map(r => r.item);
  }, [commands, options]);

  // Check if a command matches exactly
  const hasExactMatch = useCallback((query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    return commands.some(cmd =>
      cmd.name.toLowerCase() === lowerQuery ||
      cmd.searchTerms?.some(term => term.toLowerCase() === lowerQuery)
    );
  }, [commands]);

  // Get command by partial name
  const getCommandByPartialName = useCallback((partial: string): Command | undefined => {
    const lowerPartial = partial.toLowerCase();
    return commands.find(cmd =>
      cmd.name.toLowerCase().startsWith(lowerPartial)
    );
  }, [commands]);

  return {
    results: searchResults.map(r => r.item),
    scores: searchResults.map(r => r.score),
    searchResults,
    getHighlightedText,
    getSuggestions,
    hasExactMatch,
    getCommandByPartialName,
    totalResults: searchResults.length
  };
}
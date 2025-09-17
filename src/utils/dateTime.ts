/**
 * Safe date/time formatting utilities for birth data display
 * Prevents "Invalid Date" rendering and handles edge cases gracefully
 */

interface SafeFormatResult {
  label: string;
  hasTime: boolean;
}

/**
 * Safely formats birth date and time for display, handling all edge cases
 * @param dateISO - ISO date string (YYYY-MM-DD) or undefined/null
 * @param timeHHmm - Time string in HH:mm format or undefined/null
 * @returns Object with formatted label and time presence flag
 */
export const safeFormatBirthDateTime = (
  dateISO?: string | null, 
  timeHHmm?: string | null
): SafeFormatResult => {
  // Handle missing or empty date
  if (!dateISO || dateISO.trim() === '') {
    return { label: 'Unknown', hasTime: false };
  }

  try {
    // Parse the ISO date string
    const dateObj = new Date(dateISO + 'T00:00:00.000Z'); // Force UTC to avoid timezone shifts
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      // Log once per mount for debugging (keys-only, no PII)
      if (process.env.NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY === '1') {
        console.warn('fe_time_guard', { event: 'invalid_date_rendered' });
      }
      return { label: 'Unknown', hasTime: false };
    }

    // Format date using Intl for locale-aware display
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC' // Keep consistent with UTC parsing
    });
    
    const formattedDate = dateFormatter.format(dateObj);

    // Handle time component
    if (!timeHHmm || timeHHmm.trim() === '') {
      // Date only, no time
      return { label: formattedDate, hasTime: false };
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeHHmm.trim())) {
      // Invalid time format, show date only
      return { label: formattedDate, hasTime: false };
    }

    // Combine date and time for display
    const combinedLabel = `${formattedDate} ${timeHHmm.trim()}`;
    return { label: combinedLabel, hasTime: true };

  } catch (error) {
    // Catch any unexpected parsing errors
    if (process.env.NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY === '1') {
      console.warn('fe_time_guard', { event: 'date_parse_error' });
    }
    return { label: 'Unknown', hasTime: false };
  }
};

/**
 * Safe formatter for birth date only (no time component)
 * @param dateISO - ISO date string (YYYY-MM-DD) or undefined/null
 * @returns Formatted date string or 'Unknown' for invalid dates
 */
export const safeFormatBirthDate = (dateISO?: string | null): string => {
  const result = safeFormatBirthDateTime(dateISO, null);
  return result.label;
};

/**
 * Safe formatter for birth time only (no date component)
 * @param timeHHmm - Time string in HH:mm format or undefined/null
 * @returns Formatted time string or 'Not set' for missing/invalid times
 */
export const safeFormatBirthTime = (timeHHmm?: string | null): string => {
  if (!timeHHmm || timeHHmm.trim() === '') {
    return 'Not set';
  }

  // Validate time format (HH:mm)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(timeHHmm.trim())) {
    return 'Not set';
  }

  return timeHHmm.trim();
};


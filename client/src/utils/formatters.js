// Data formatters with Nepal Timezone (UTC+5:45)

/**
 * Convert date to Nepal timezone (UTC+5:45) with English format
 * @param {string|Date} date - Date to convert
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date in Nepal timezone
 */
export const formatNepaliTime = (date, options = {}) => {
  const dateObj = new Date(date);

  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    ...options,
  };

  // Format with Nepal timezone (Asia/Kathmandu automatically handles UTC+5:45)
  return new Intl.DateTimeFormat("en-US", {
    ...defaultOptions,
    timeZone: "Asia/Kathmandu",
  }).format(dateObj);
};

/**
 * Format date only in Nepal timezone
 * @param {string|Date} date - Date to format
 * @returns {string} Date formatted as "September 3, 2025"
 */
export const formatNepaliDate = (date) => {
  return formatNepaliTime(date, {
    hour: undefined,
    minute: undefined,
    timeZoneName: undefined,
  });
};

/**
 * Format time only in Nepal timezone
 * @param {string|Date} date - Date to format
 * @returns {string} Time formatted as "2:30 PM +0545"
 */
export const formatNepaliTimeOnly = (date) => {
  return formatNepaliTime(date, {
    year: undefined,
    month: undefined,
    day: undefined,
    timeZoneName: "short",
  });
};

/**
 * Get current date and time in Nepal timezone
 * @returns {string} Current datetime in Nepal timezone
 */
export const getCurrentNepaliTime = () => {
  return formatNepaliTime(new Date());
};

/**
 * Format datetime for medical reports in Nepal timezone
 * @param {string|Date} date - Date to format
 * @returns {string} Medical format: "September 3, 2025 at 06:25 AM +0545"
 */
export const formatMedicalDateTime = (date) => {
  const dateObj = new Date(date);

  // Get date parts in Nepal timezone
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);

  // Get time parts in Nepal timezone
  const timeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(dateObj);

  return `${dateStr} at ${timeStr} +0545`;
};

/**
 * Format date for PDF reports in Nepal timezone
 * @param {string|Date} date - Date to format
 * @returns {string} PDF format: "9/3/2025, 3:59:23 AM"
 */
export const formatPDFDateTime = (date) => {
  const dateObj = new Date(date);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(dateObj);
};

/**
 * Get current date in Nepal timezone
 * @returns {Date} Current date object adjusted to Nepal timezone
 */
export const getNepaliCurrentDate = () => {
  const now = new Date();

  // Get the current time in Nepal timezone
  const nepaliTimeString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  // Convert back to Date object (this will be in Nepal time)
  return new Date(
    nepaliTimeString.replace(
      /(\d{4})-(\d{2})-(\d{2}), (\d{2}):(\d{2}):(\d{2})/,
      "$1-$2-$3T$4:$5:$6"
    )
  );
};

/**
 * Get current year in Nepal timezone
 * @returns {number} Current year in Nepal timezone
 */
export const getNepaliCurrentYear = () => {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
  });
};

/**
 * Calculate age from birth date in Nepal timezone
 * @param {string|Date} birthDate - Birth date
 * @returns {number} Age in years
 */
export const calculateAgeInNepali = (birthDate) => {
  const birth = new Date(birthDate);
  const today = getNepaliCurrentDate();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

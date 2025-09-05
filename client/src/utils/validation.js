// Validation functions

/**
 * Validates email format using a comprehensive regex pattern
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid, false otherwise
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") {
    return false;
  }

  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email);
};

/**
 * Validates email format and checks for common issues
 * @param {string} email - Email address to validate
 * @returns {object} - Object with isValid boolean and error message if invalid
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === "") {
    return {
      isValid: false,
      error: "Email is required",
    };
  }

  const trimmedEmail = email.trim();

  // Check minimum length
  if (trimmedEmail.length < 5) {
    return {
      isValid: false,
      error: "Email is too short",
    };
  }

  // Check maximum length (254 is RFC limit)
  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      error: "Email is too long",
    };
  }

  // Check for @ symbol
  if (!trimmedEmail.includes("@")) {
    return {
      isValid: false,
      error: "Email must contain @ symbol",
    };
  }

  // Check for multiple @ symbols
  if ((trimmedEmail.match(/@/g) || []).length !== 1) {
    return {
      isValid: false,
      error: "Email must contain exactly one @ symbol",
    };
  }

  const [localPart, domain] = trimmedEmail.split("@");

  // Check local part (before @)
  if (!localPart || localPart.length === 0) {
    return {
      isValid: false,
      error: "Email must have a username before @",
    };
  }

  if (localPart.length > 64) {
    return {
      isValid: false,
      error: "Email username part is too long",
    };
  }

  // Check domain part (after @)
  if (!domain || domain.length === 0) {
    return {
      isValid: false,
      error: "Email must have a domain after @",
    };
  }

  if (!domain.includes(".")) {
    return {
      isValid: false,
      error: "Email domain must contain a dot",
    };
  }

  // Check for consecutive dots
  if (trimmedEmail.includes("..")) {
    return {
      isValid: false,
      error: "Email cannot contain consecutive dots",
    };
  }

  // Check if starts or ends with dot
  if (trimmedEmail.startsWith(".") || trimmedEmail.endsWith(".")) {
    return {
      isValid: false,
      error: "Email cannot start or end with a dot",
    };
  }

  // Use regex for final validation
  if (!isValidEmail(trimmedEmail)) {
    return {
      isValid: false,
      error: "Please enter a valid email address",
    };
  }

  return {
    isValid: true,
    error: null,
  };
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - Object with isValid boolean and error message if invalid
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      error: "Password is required",
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: "Password must be at least 6 characters long",
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: "Password is too long (max 128 characters)",
    };
  }

  return {
    isValid: true,
    error: null,
  };
};

/**
 * Validates full name
 * @param {string} name - Full name to validate
 * @returns {object} - Object with isValid boolean and error message if invalid
 */
export const validateFullName = (name) => {
  if (!name || name.trim() === "") {
    return {
      isValid: false,
      error: "Full name is required",
    };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: "Full name must be at least 2 characters long",
    };
  }

  if (trimmedName.length > 100) {
    return {
      isValid: false,
      error: "Full name is too long (max 100 characters)",
    };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error:
        "Full name can only contain letters, spaces, hyphens, and apostrophes",
    };
  }

  return {
    isValid: true,
    error: null,
  };
};

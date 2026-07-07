/**
 * Reusable validation utility functions for Admin forms on the frontend.
 */

// --- INPUT CLEANERS (Prevent invalid typing) ---

/**
 * Retains only alphabets and spaces.
 */
export const cleanNameInput = (val: string): string => {
  return val.replace(/[^a-zA-Z\s]/g, '');
};

/**
 * Retains only numbers, maximum 10 digits.
 */
export const cleanPhoneInput = (val: string): string => {
  return val.replace(/[^0-9]/g, '').slice(0, 10);
};

/**
 * Retains only numbers, maximum 12 digits.
 */
export const cleanAadhaarInput = (val: string): string => {
  return val.replace(/[^0-9]/g, '').slice(0, 12);
};

/**
 * Retains only positive integers (minimum 0, no negative sign, no letters).
 */
export const cleanNumberInput = (val: string): string => {
  let cleaned = val.replace(/[^0-9]/g, '');
  // Strip leading zeroes but retain single '0'
  if (cleaned.length > 1) {
    cleaned = cleaned.replace(/^0+/, '');
  }
  return cleaned;
};

/**
 * Retains only letters, numbers, and hyphens.
 */
export const cleanRollNumberInput = (val: string): string => {
  return val.replace(/[^a-zA-Z0-9-]/g, '');
};

// --- FIELD VALIDATORS (Inline error reporting) ---

/**
 * Validates Name (First Name, Last Name, Father Name, Mother Name, Teacher Name, Parent Name, Guardian Name).
 * Only letters, spaces, maximum 50 characters.
 */
export const validateName = (name: string, fieldName: string = 'Name'): string | null => {
  const trimmed = name.trim();
  if (!trimmed) {
    return `${fieldName} is required.`;
  }
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(trimmed)) {
    return 'Only alphabets and spaces are allowed.';
  }
  if (trimmed.length > 50) {
    return `${fieldName} must be 50 characters or less.`;
  }
  return null;
};

/**
 * Validates contact phone numbers.
 * Numbers only, exactly 10 digits, Indian mobile format (first digit must be 6, 7, 8, 9).
 */
export const validatePhone = (phone: string, fieldName: string = 'Phone number'): string | null => {
  if (!phone) {
    return `${fieldName} is required.`;
  }
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return 'Enter a valid 10-digit Indian mobile number.';
  }
  return null;
};

/**
 * Validates Aadhaar card number.
 * Numbers only, exactly 12 digits.
 */
export const validateAadhaar = (aadhaar: string, fieldName: string = 'Aadhaar number'): string | null => {
  if (!aadhaar) {
    return `${fieldName} is required.`;
  }
  const aadhaarRegex = /^\d{12}$/;
  if (!aadhaarRegex.test(aadhaar)) {
    return 'Aadhaar must contain exactly 12 digits.';
  }
  return null;
};

/**
 * Validates Email formatting.
 */
export const validateEmail = (email: string, fieldName: string = 'Email address'): string | null => {
  if (!email) {
    return `${fieldName} is required.`;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Enter a valid email address.';
  }
  return null;
};

/**
 * Validates Date of Birth based on role.
 * Cannot be in the future, age constraints: student must be reasonable (2-25), teacher (min 18), principal (min 25).
 */
export const validateDOB = (dobStr: string, role: 'student' | 'teacher' | 'principal'): string | null => {
  if (!dobStr) {
    return 'Date of Birth is required.';
  }
  const dob = new Date(dobStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dob.setHours(0, 0, 0, 0);

  if (isNaN(dob.getTime())) {
    return 'Enter a valid Date of Birth (YYYY-MM-DD).';
  }

  if (dob > today) {
    return 'Cannot be a future date.';
  }

  const age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  const isBirthdayPassed = m > 0 || (m === 0 && today.getDate() >= dob.getDate());
  const actualAge = isBirthdayPassed ? age : age - 1;

  if (role === 'student') {
    if (actualAge < 2) {
      return 'Student must be at least 2 years old.';
    }
    if (actualAge > 25) {
      return 'Enter a reasonable age for a student.';
    }
  } else if (role === 'teacher') {
    if (actualAge < 18) {
      return 'Teacher age minimum 18 years.';
    }
    if (actualAge > 100) {
      return 'Enter a valid Date of Birth.';
    }
  } else if (role === 'principal') {
    if (actualAge < 25) {
      return 'Principal age minimum 25 years.';
    }
    if (actualAge > 100) {
      return 'Enter a valid Date of Birth.';
    }
  }

  return null;
};

/**
 * Validates Roll Number formats.
 * Letters, Numbers, Hyphens only.
 */
export const validateRollNumber = (rollNum: string): string | null => {
  if (!rollNum) {
    return 'Roll number is required.';
  }
  const rollRegex = /^[a-zA-Z0-9-]+$/;
  if (!rollRegex.test(rollNum)) {
    return 'Roll Number must contain only letters, numbers, and hyphens.';
  }
  return null;
};

/**
 * Validates Password strength.
 * Minimum 8 characters, must contain uppercase, lowercase, number, and special character.
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return 'Must contain uppercase, lowercase, a number, and a special character.';
  }
  return null;
};

// Shared domain constants and helpers.

export const MIN_AGE = 21;

// Curated, non-exhaustive list of common STIs/STDs used for structured
// disclosure. "Other" lets members specify anything not listed. The goal is a
// respectful, stigma-free way to be upfront — disclosure is required on signup.
export const CONDITIONS = [
  'Herpes (HSV-1)',
  'Herpes (HSV-2)',
  'HPV',
  'HIV',
  'Hepatitis B',
  'Hepatitis C',
  'Chlamydia',
  'Gonorrhea',
  'Syphilis',
  'Trichomoniasis',
  'Molluscum contagiosum',
  'Other',
];

// Condition(s) for which the U=U (Undetectable = Untransmittable) status applies.
export const UU_CONDITION = 'HIV';

export const GENDERS = [
  'Woman',
  'Man',
  'Non-binary',
  'Transgender woman',
  'Transgender man',
  'Genderfluid',
  'Agender',
  'Other',
];

export const PRONOUNS = ['she/her', 'he/him', 'they/them', 'she/they', 'he/they', 'ze/zir', 'Ask me'];

export const ORIENTATIONS = [
  'Straight',
  'Gay',
  'Lesbian',
  'Bisexual',
  'Pansexual',
  'Queer',
  'Asexual',
  'Questioning',
];

export const INTERESTS = [
  'Hiking', 'Coffee', 'Music', 'Art', 'Yoga', 'Cooking', 'Travel', 'Gaming',
  'Reading', 'Movies', 'Fitness', 'Dogs', 'Cats', 'Photography', 'Dancing',
  'Foodie', 'Live shows', 'Volunteering', 'Nature', 'Tech',
];

export const LOOKING_FOR = [
  'A long-term relationship',
  'Something casual',
  'New friendships',
  'Community & support',
  'Still figuring it out',
];

export function ageFromBirthdate(birthdate) {
  const dob = new Date(birthdate + 'T00:00:00');
  if (isNaN(dob.getTime())) return NaN;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function isAdult21(birthdate) {
  const age = ageFromBirthdate(birthdate);
  return Number.isFinite(age) && age >= MIN_AGE;
}

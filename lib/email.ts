export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isKimepEmail(email: string) {
  const e = normalizeEmail(email);

  // exact domain only
  return e.endsWith("@kimep.kz");
}
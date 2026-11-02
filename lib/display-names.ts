export function doctorNameWithoutTitle(name: string) {
  return name.trim().replace(/^(dr\.?\s*)+/i, "").trim();
}

export function doctorDisplayName(name: string) {
  const cleanName = doctorNameWithoutTitle(name);
  return cleanName ? `Dr. ${cleanName}` : "Dr.";
}

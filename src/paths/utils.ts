export function toKebabCase(str: string): string {
  return str
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/\B([A-Z])/g, '-$1')
    .toLowerCase()
}

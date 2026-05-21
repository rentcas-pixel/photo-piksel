/** Lietuviškas katalogų skaičiaus tekstas viešam cover / sąrašui. */
export function formatCatalogCount(count: number): string {
  if (count === 0) return '0 katalogų'
  if (count === 1) return '1 katalogas'
  if (count % 10 === 1 && count % 100 !== 11) return `${count} katalogas`
  if (count % 10 >= 2 && count % 10 <= 9 && (count % 100 < 10 || count % 100 >= 20)) {
    return `${count} katalogai`
  }
  return `${count} katalogų`
}

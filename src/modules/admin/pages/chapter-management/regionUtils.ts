/** Map dialect name → ChallengeBank.region (BAC | TRUNG | NAM). */
export function getRegionKeyFromDialect(dialectId: string, dialects: any[]): string {
  const d = dialects.find((item: any) => item.id === dialectId);
  if (!d) return 'BAC';
  const name = (d.name || '').toUpperCase();
  if (name.includes('BẮC') || name.includes('BAC') || name.includes('NORTH')) return 'BAC';
  if (name.includes('TRUNG') || name.includes('CENTRAL')) return 'TRUNG';
  if (name.includes('NAM') || name.includes('SOUTH')) return 'NAM';
  return 'BAC';
}

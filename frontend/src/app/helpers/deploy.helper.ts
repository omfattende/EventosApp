export function isDeployed(): boolean {
  return typeof window !== 'undefined' && window.location.hostname !== 'localhost';
}

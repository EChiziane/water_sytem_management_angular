import { environment } from '../../../environments/environments';
/** Explicit browser-only mode, independent of build optimization/hosting. */
export function usesBrowserData(): boolean {
  return environment.dataMode === 'local' && environment.useLocalFallback;
}

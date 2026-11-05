import { HttpErrorResponse } from '@angular/common/http';
/** A failed write must reach the caller, never become a successful operation. */
export function writeBrowserData(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    throw new HttpErrorResponse({
      status: 507,
      statusText: 'Browser storage unavailable',
      error: { code: 'BROWSER_STORAGE_UNAVAILABLE' },
    });
  }
}

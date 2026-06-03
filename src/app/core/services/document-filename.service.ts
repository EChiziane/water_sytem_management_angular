import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocumentFilenameService {

  build(prefix: string, value: string | number | null | undefined, extension: string = 'pdf'): string {
    const safePrefix = this.normalize(prefix) || 'DOCUMENTO';
    const safeValue = this.normalize(String(value || 'SEM_REFERENCIA'));
    const safeExtension = this.normalize(extension).toLowerCase() || 'pdf';

    return `${safePrefix}_${safeValue}.${safeExtension}`;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  }
}

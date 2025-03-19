// Type definitions for Google Analytics gtag.js
interface Window {
  gtag: (
    command: 'config' | 'event' | 'set',
    targetId: string,
    config?: {
      [key: string]: any;
    }
  ) => void;
  dataLayer: any[];
}

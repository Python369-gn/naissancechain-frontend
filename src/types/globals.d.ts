/**
 * Global type definitions for NaissanceChain
 */
import { Html5Qrcode } from "html5-qrcode";

declare global {
  interface Window {
    jsQR: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
    Html5Qrcode: typeof Html5Qrcode;
  }
}

export {};

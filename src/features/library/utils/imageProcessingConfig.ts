/**
 * Image Processing Configuration for Cover Analysis
 *
 * Strategy: Optimize for Azure Computer Vision API upload
 * - Max file size: 4MB (API limit)
 * - Target size: 200-500KB for balance of quality and speed
 * - Resolution: 1920px width maintains OCR quality while reducing size
 * - Compression: 0.8 JPEG quality balances file size and text clarity
 *
 * This ensures:
 * 1. Fast upload times over mobile networks
 * 2. Sufficient resolution for OCR on book covers
 * 3. Well within API limits with room for error
 */

/** Width of the scan area guide overlay (in logical pixels) */
export const SCAN_AREA_WIDTH = 280;

/** Height of the scan area guide overlay (in logical pixels) */
export const SCAN_AREA_HEIGHT = 350;

/** Target width for resized images before upload */
export const RESIZE_WIDTH = 1920;

/** JPEG compression quality (0-1) */
export const COMPRESSION_QUALITY = 0.8;

/** Timeout for the cover analysis API request (ms) */
export const ANALYSIS_TIMEOUT_MS = 30_000;

/** Seconds before showing "still processing" warning in the UI */
export const SLOW_ANALYSIS_WARNING_SECONDS = 8;

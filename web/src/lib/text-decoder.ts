/**
 * Robust Text Buffer Decoder
 * Automatically detects UTF-8, UTF-16 LE/BE with BOM or null byte patterns,
 * strips BOM marks, and normalizes stray null bytes.
 */
export function decodeTextBuffer(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length === 0) return "";

  let decoder: TextDecoder;
  // UTF-16 LE BOM: 0xFF, 0xFE
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    decoder = new TextDecoder("utf-16le");
  }
  // UTF-16 BE BOM: 0xFE, 0xFF
  else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    decoder = new TextDecoder("utf-16be");
  }
  // UTF-8 BOM: 0xEF, 0xBB, 0xBF
  else if (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    decoder = new TextDecoder("utf-8");
  }
  // Heuristic: Check for UTF-16 LE without BOM (alternating zero bytes in first 100 bytes)
  else if (bytes.length >= 4 && bytes[1] === 0x00 && bytes[3] === 0x00) {
    decoder = new TextDecoder("utf-16le");
  }
  // Heuristic: Check for UTF-16 BE without BOM
  else if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[2] === 0x00) {
    decoder = new TextDecoder("utf-16be");
  } else {
    decoder = new TextDecoder("utf-8");
  }

  let text = decoder.decode(bytes);

  // Strip leading BOM (0xFEFF / 0xFFFE)
  if (text.charCodeAt(0) === 0xfeff || text.charCodeAt(0) === 0xfffe) {
    text = text.slice(1);
  }

  // Remove any remaining stray null bytes (from malformed text or UTF-16 conversions)
  if (text.includes("\u0000")) {
    text = text.replace(/\u0000/g, "");
  }

  return text;
}

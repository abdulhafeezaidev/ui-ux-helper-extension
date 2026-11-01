/**
 * Pure TypeScript PKZIP Packager
 * Generates standard, valid .zip files directly in browser or node environments without external dependencies.
 */

// CRC-32 Lookup Table
const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

export function computeCrc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export interface ZipFileInput {
  path: string;
  data: string | Uint8Array;
}

export class ZipPackager {
  private files: ZipFileInput[] = [];

  public addFile(path: string, data: string | Uint8Array): this {
    // Normalize path: forward slashes, strip leading slash
    const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
    this.files.push({ path: cleanPath, data });
    return this;
  }

  public addFiles(files: Record<string, string | Uint8Array>): this {
    for (const [path, data] of Object.entries(files)) {
      this.addFile(path, data);
    }
    return this;
  }

  public generateZip(): Uint8Array {
    const textEncoder = new TextEncoder();
    const localHeaders: Uint8Array[] = [];
    const centralDirectoryHeaders: Uint8Array[] = [];

    let offset = 0;

    const now = new Date();
    const dosTime =
      ((now.getHours() & 0x1f) << 11) |
      ((now.getMinutes() & 0x3f) << 5) |
      ((Math.floor(now.getSeconds() / 2)) & 0x1f);
    const dosDate =
      (((now.getFullYear() - 1980) & 0x7f) << 9) |
      (((now.getMonth() + 1) & 0x0f) << 5) |
      (now.getDate() & 0x1f);

    for (const file of this.files) {
      const fileNameBytes = textEncoder.encode(file.path);
      const fileDataBytes = typeof file.data === 'string' ? textEncoder.encode(file.data) : file.data;

      const crc = computeCrc32(fileDataBytes);
      const uncompressedSize = fileDataBytes.length;
      const compressedSize = uncompressedSize; // Stored (uncompressed) method = 0

      // 1. Local File Header (30 bytes + filename length + data length)
      const localHeader = new Uint8Array(30 + fileNameBytes.length + fileDataBytes.length);
      const localView = new DataView(localHeader.buffer);

      localView.setUint32(0, 0x04034b50, true); // Local file header signature
      localView.setUint16(4, 20, true);         // Version needed to extract (2.0)
      localView.setUint16(6, 0x0800, true);     // General purpose bit flag (UTF-8)
      localView.setUint16(8, 0, true);          // Compression method (0 = store)
      localView.setUint16(10, dosTime, true);   // File last mod time
      localView.setUint16(12, dosDate, true);   // File last mod date
      localView.setUint32(14, crc, true);       // CRC-32
      localView.setUint32(18, compressedSize, true);   // Compressed size
      localView.setUint32(22, uncompressedSize, true); // Uncompressed size
      localView.setUint16(26, fileNameBytes.length, true); // Filename length
      localView.setUint16(28, 0, true);         // Extra field length

      localHeader.set(fileNameBytes, 30);
      localHeader.set(fileDataBytes, 30 + fileNameBytes.length);
      localHeaders.push(localHeader);

      // 2. Central Directory File Header (46 bytes + filename length)
      const centralHeader = new Uint8Array(46 + fileNameBytes.length);
      const centralView = new DataView(centralHeader.buffer);

      centralView.setUint32(0, 0x02014b50, true); // Central file header signature
      centralView.setUint16(4, 20, true);         // Version made by
      centralView.setUint16(6, 20, true);         // Version needed to extract
      centralView.setUint16(8, 0x0800, true);     // General purpose bit flag (UTF-8)
      centralView.setUint16(10, 0, true);         // Compression method (0 = store)
      centralView.setUint16(12, dosTime, true);   // File last mod time
      centralView.setUint16(14, dosDate, true);   // File last mod date
      centralView.setUint32(16, crc, true);       // CRC-32
      centralView.setUint32(20, compressedSize, true);   // Compressed size
      centralView.setUint32(24, uncompressedSize, true); // Uncompressed size
      centralView.setUint16(28, fileNameBytes.length, true); // Filename length
      centralView.setUint16(30, 0, true);         // Extra field length
      centralView.setUint16(32, 0, true);         // File comment length
      centralView.setUint16(34, 0, true);         // Disk number start
      centralView.setUint16(36, 0, true);         // Internal file attributes
      centralView.setUint32(38, 0, true);         // External file attributes
      centralView.setUint32(42, offset, true);    // Relative offset of local header

      centralHeader.set(fileNameBytes, 46);
      centralDirectoryHeaders.push(centralHeader);

      offset += localHeader.length;
    }

    const centralDirectoryOffset = offset;
    let centralDirectorySize = 0;
    for (const h of centralDirectoryHeaders) {
      centralDirectorySize += h.length;
    }

    // 3. End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);

    eocdView.setUint32(0, 0x06054b50, true); // End of central dir signature
    eocdView.setUint16(4, 0, true);          // Number of this disk
    eocdView.setUint16(6, 0, true);          // Disk where central directory starts
    eocdView.setUint16(8, this.files.length, true);  // Number of central directory records on this disk
    eocdView.setUint16(10, this.files.length, true); // Total number of central directory records
    eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
    eocdView.setUint32(16, centralDirectoryOffset, true); // Offset of start of central directory
    eocdView.setUint16(20, 0, true);         // Comment length

    // Assemble final zip buffer
    const totalSize = offset + centralDirectorySize + 22;
    const zipBytes = new Uint8Array(totalSize);

    let currentPos = 0;
    for (const lh of localHeaders) {
      zipBytes.set(lh, currentPos);
      currentPos += lh.length;
    }
    for (const ch of centralDirectoryHeaders) {
      zipBytes.set(ch, currentPos);
      currentPos += ch.length;
    }
    zipBytes.set(eocd, currentPos);

    return zipBytes;
  }

  public toBase64(): string {
    const bytes = this.generateZip();
    let binary = '';
    const CHUNK_SIZE = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
      binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(binary);
  }
}

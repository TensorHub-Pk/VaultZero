/**
 * VaultZero — Zero-Knowledge Offline Encryption
 * Copyright (c) 2026 VaultZero Contributors
 * SPDX-License-Identifier: MIT
 * 
 * image-hide.js
 * Offline zero-knowledge Robust Threshold Steganography.
 * Hides Base64 encoded encrypted payloads inside HTML5 Canvas image data.
 */

// --- Internal Helper: CRC32 for integrity ---
const _CRC_TABLE = new Int32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    _CRC_TABLE[i] = c;
}

function _computeCRC32(str) {
    let crc = -1;
    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ _CRC_TABLE[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ -1) >>> 0;
}


// Embeds text (Base64) into an Image object and returns a Data URL (PNG)
async function embedTextInImage(imageElement, text) {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            // 'willReadFrequently' optimizes for getImageData
            const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
            
            // ALWAYS use natural dimensions to avoid browser-rescaling artifacts
            const w = imageElement.naturalWidth || imageElement.width || 1;
            const h = imageElement.naturalHeight || imageElement.height || 1;
            canvas.width = w;
            canvas.height = h;
            
            ctx.drawImage(imageElement, 0, 0, w, h);

            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            const MAGIC = "VZSG";
            const payload = text;
            const payloadLen = payload.length;
            const crc = _computeCRC32(payload);
            
            // Format: MAGIC(4) + LEN(4) + PAYLOAD(N) + CRC(4)
            const header = MAGIC + 
                           String.fromCharCode((payloadLen >>> 24) & 0xFF) +
                           String.fromCharCode((payloadLen >>> 16) & 0xFF) +
                           String.fromCharCode((payloadLen >>> 8) & 0xFF) +
                           String.fromCharCode(payloadLen & 0xFF);
            
            const footer = String.fromCharCode((crc >>> 24) & 0xFF) +
                           String.fromCharCode((crc >>> 16) & 0xFF) +
                           String.fromCharCode((crc >>> 8) & 0xFF) +
                           String.fromCharCode(crc & 0xFF);
            
            const fullStream = header + payload + footer;
            const fullStreamLen = fullStream.length;
            
            // STRICT CAPACITY VALIDATION
            const requiredBits = fullStreamLen * 8;
            const totalBits = w * h * 3;

            if (requiredBits > totalBits) {
                return reject(new Error(`Capacity Error: Payload too large for this image. Need ${Math.ceil(requiredBits/3)} pixels, found ${w*h}.`));
            }

            let streamIdx = 0;
            let bitIdx = 0;
            const imgLen = data.length;

            for (let i = 0; i < imgLen; i += 4) {
                // Stabilize alpha
                data[i + 3] = 255; 

                for (let j = 0; j < 3; j++) {
                    if (streamIdx < fullStreamLen) {
                        const bit = (fullStream.charCodeAt(streamIdx) >> (7 - bitIdx)) & 1;
                        // 3-bit threshold encoding (preserved)
                        data[i + j] = (data[i + j] & 0xF8) | (bit ? 7 : 0);
                        
                        bitIdx++;
                        if (bitIdx === 8) {
                            bitIdx = 0;
                            streamIdx++;
                        }
                    }
                }
                if (streamIdx >= fullStreamLen) break;
            }

            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
            
        } catch (error) {
            reject(new Error("Stego embedding failed: " + error.message));
        }
    });
}

// Extracts text from an Image object
async function extractTextFromImage(imageElement) {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
            
            const w = imageElement.naturalWidth || imageElement.width || 1;
            const h = imageElement.naturalHeight || imageElement.height || 1;
            canvas.width = w;
            canvas.height = h;
            
            ctx.drawImage(imageElement, 0, 0, w, h);

            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            const delimiter = '|||END|||';
            const MAGIC = "VZSG";
            
            let currentByte = 0;
            let bitCount = 0;
            let extractedData = '';
            
            // Extraction State
            let formatChecked = false;
            let isNewFormat = false;
            let expectedPayloadLen = 0;
            let expectedCRC = 0;

            for (let i = 0; i < data.length; i += 4) {
                for (let j = 0; j < 3; j++) {
                    const extractedBit = ((data[i + j] & 0x07) > 3) ? 1 : 0;
                    currentByte = (currentByte << 1) | extractedBit;
                    bitCount++;
                    
                    if (bitCount === 8) {
                        extractedData += String.fromCharCode(currentByte);
                        currentByte = 0;
                        bitCount = 0;

                        // 1. Check Format (Magic)
                        if (!formatChecked && extractedData.length === 4) {
                            if (extractedData === MAGIC) {
                                isNewFormat = true;
                            }
                            formatChecked = true;
                        }

                        // 2. Process based on format
                        if (isNewFormat) {
                            // Read Length (bytes 4-7)
                            if (expectedPayloadLen === 0 && extractedData.length === 8) {
                                expectedPayloadLen = (extractedData.charCodeAt(4) << 24) |
                                                     (extractedData.charCodeAt(5) << 16) |
                                                     (extractedData.charCodeAt(6) << 8) |
                                                     (extractedData.charCodeAt(7));
                                
                                if (expectedPayloadLen > 10000000) break; // Safety
                            }
                            
                            // Read Payload + CRC
                            if (expectedPayloadLen > 0 && extractedData.length === (12 + expectedPayloadLen)) {
                                const payload = extractedData.substring(8, 8 + expectedPayloadLen);
                                const crcOffset = 8 + expectedPayloadLen;
                                const readCRC = (extractedData.charCodeAt(crcOffset) << 24 |
                                                 extractedData.charCodeAt(crcOffset+1) << 16 |
                                                 extractedData.charCodeAt(crcOffset+2) << 8 |
                                                 extractedData.charCodeAt(crcOffset+3)) >>> 0;
                                
                                if (_computeCRC32(payload) !== readCRC) {
                                    throw new Error("Steganographic corruption detected (CRC mismatch).");
                                }
                                return resolve(payload);
                            }
                        } else if (formatChecked) {
                            // BACKWARD COMPATIBILITY: Legacy delimiter search
                            if (extractedData.endsWith(delimiter)) {
                                return resolve(extractedData.slice(0, -delimiter.length));
                            }
                        }
                    }
                }
                if (extractedData.length > 10000000) break;
            }

            reject(new Error("No hidden payload detected in this secure image."));
            
        } catch (error) {
            reject(new Error("Stego extraction error: " + error.message));
        }
    });
}

// Helpers
function fileToImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Data error: Image loading failed."));
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

window.Stego = {
    hide: embedTextInImage,
    reveal: extractTextFromImage,
    prepareImage: fileToImage
};


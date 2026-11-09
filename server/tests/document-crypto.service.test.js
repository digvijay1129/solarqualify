import { describe, expect, it } from 'vitest';
import {
  decryptDocument,
  encryptDocument,
} from '../src/modules/bills/document-crypto.service.js';

describe('Document Crypto Service', () => {
  it('should encrypt and decrypt a document successfully', () => {
    const original = Buffer.from('SolarQualify confidential electricity bill');

    const result = encryptDocument(original);

    expect(result.encryptedBuffer).not.toEqual(original);
    expect(result.encryption.algorithm).toBe('aes-256-gcm');

    const decrypted = decryptDocument(
      result.encryptedBuffer,
      result.encryption
    );

    expect(decrypted).toEqual(original);
  });

  it('should generate a unique IV for every encryption', () => {
    const document = Buffer.from('Test document');

    const first = encryptDocument(document);
    const second = encryptDocument(document);

    expect(first.encryption.iv).not.toBe(second.encryption.iv);
  });

  it('should reject modified encrypted content', () => {
    const original = Buffer.from('Confidential bill content');
    const result = encryptDocument(original);

    const tampered = Buffer.from(result.encryptedBuffer);
    tampered[0] ^= 1;

    expect(() => {
      decryptDocument(tampered, result.encryption);
    }).toThrow();
  });

  it('should reject an invalid authentication tag', () => {
    const result = encryptDocument(Buffer.from('Test document'));

    const invalidEncryption = {
      ...result.encryption,
      authTag: Buffer.alloc(16).toString('base64'),
    };

    expect(() => {
      decryptDocument(result.encryptedBuffer, invalidEncryption);
    }).toThrow();
  });

  it('should reject empty document content during encryption', () => {
    expect(() => encryptDocument(Buffer.alloc(0))).toThrow(
      'Document content must be a non-empty Buffer.'
    );
  });

  it('should reject invalid encryption metadata', () => {
    expect(() => {
      decryptDocument(Buffer.from('encrypted'), {});
    }).toThrow('Invalid document encryption metadata.');
  });
});
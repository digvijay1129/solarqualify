
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const {
  mockClient,
  mockImageKitConstructor,
  mockToFile,
} = vi.hoisted(() => {
  const client = {
    files: {
      upload: vi.fn(),
      delete: vi.fn(),
    },
    helper: {
      buildSrc: vi.fn(),
    },
  };

  return {
    mockClient: client,
    mockImageKitConstructor: vi.fn(function FakeImageKit() {
      return client;
    }),
    mockToFile: vi.fn(),
  };
});

vi.mock('@imagekit/nodejs', () => ({
  default: mockImageKitConstructor,
  toFile: mockToFile,
}));

vi.mock('../src/config/env.js', () => ({
  env: {
    MAX_UPLOAD_MB: 5,
    IMAGEKIT_PRIVATE_KEY: 'test-private-key',
    IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/test-account',
  },
}));

import {
  uploadEncryptedDocument,
  deleteStoredDocument,
  downloadEncryptedDocument,
} from '../src/modules/bills/imagekit-storage.service.js';

const VALID_FILE_PATH =
  '/solarqualify/bills/550e8400-e29b-41d4-a716-446655440000.pdf';

describe('ImageKit Storage Service', () => {
  beforeEach(() => {
    mockClient.files.upload.mockReset();
    mockClient.files.delete.mockReset();
    mockClient.helper.buildSrc.mockReset();

    mockImageKitConstructor.mockClear();

    mockToFile.mockReset().mockImplementation(
      async (buffer, fileName) => ({
        buffer,
        fileName,
      })
    );

    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('uploadEncryptedDocument', () => {
    it('should reject non-Buffer input', async () => {
      await expect(
        uploadEncryptedDocument('invalid', 'pdf')
      ).rejects.toThrow(
        'Document content must be a non-empty Buffer.'
      );
    });

    it('should reject empty document content', async () => {
      await expect(
        uploadEncryptedDocument(Buffer.alloc(0), 'pdf')
      ).rejects.toThrow(
        'Document content must be a non-empty Buffer.'
      );
    });

    it('should reject files exceeding the configured size limit', async () => {
      const oversizedBuffer = Buffer.alloc(
        5 * 1024 * 1024 + 1
      );

      await expect(
        uploadEncryptedDocument(oversizedBuffer, 'pdf')
      ).rejects.toThrow(
        'Document exceeds the maximum upload size.'
      );
    });

    it('should reject unsupported extensions', async () => {
      await expect(
        uploadEncryptedDocument(Buffer.from('test'), 'exe')
      ).rejects.toThrow(
        'Unsupported document extension.'
      );
    });

    it('should upload an encrypted document as a private file', async () => {
      const encryptedBuffer = Buffer.from('encrypted document');

      mockClient.files.upload.mockImplementation(
        async ({ fileName }) => ({
          fileId: 'imagekit-file-123',
          filePath: `/solarqualify/bills/${fileName}`,
          size: encryptedBuffer.length,
          fileType: 'non-image',
          isPrivateFile: true,
        })
      );

      const result = await uploadEncryptedDocument(
        encryptedBuffer,
        'PDF'
      );

      expect(mockToFile).toHaveBeenCalledWith(
        encryptedBuffer,
        expect.stringMatching(
          /^[0-9a-f-]{36}\.pdf$/i
        )
      );

      expect(mockClient.files.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: '/solarqualify/bills',
          useUniqueFileName: false,
          isPrivateFile: true,
          responseFields: ['isPrivateFile'],
        })
      );

      expect(result).toEqual({
        storageProvider: 'imagekit',
        storageFileId: 'imagekit-file-123',
        storagePath: expect.stringMatching(
          /^\/solarqualify\/bills\/[0-9a-f-]{36}\.pdf$/i
        ),
        documentSize: encryptedBuffer.length,
        storageFileType: 'non-image',
      });

      expect(result).not.toHaveProperty('storageUrl');
    });

    it('should delete the uploaded file if privacy is not confirmed', async () => {
      mockClient.files.upload.mockImplementation(
        async ({ fileName }) => ({
          fileId: 'non-private-file',
          filePath: `/solarqualify/bills/${fileName}`,
          isPrivateFile: false,
        })
      );

      mockClient.files.delete.mockResolvedValue(undefined);

      await expect(
        uploadEncryptedDocument(Buffer.from('encrypted'), 'pdf')
      ).rejects.toThrow(
        'ImageKit did not confirm the required private document metadata.'
      );

      expect(mockClient.files.delete).toHaveBeenCalledWith(
        'non-private-file'
      );
    });
  });

  describe('deleteStoredDocument', () => {
    it('should reject an invalid file ID', async () => {
      await expect(
        deleteStoredDocument('')
      ).rejects.toThrow(
        'A valid ImageKit file ID is required.'
      );
    });

    it('should delete a stored document', async () => {
      mockClient.files.delete.mockResolvedValue(undefined);

      await deleteStoredDocument('imagekit-file-123');

      expect(mockClient.files.delete).toHaveBeenCalledWith(
        'imagekit-file-123'
      );
    });
  });

  describe('downloadEncryptedDocument', () => {
    it('should reject an invalid storage path', async () => {
      await expect(
        downloadEncryptedDocument('/unauthorized/file.pdf')
      ).rejects.toThrow(
        'Invalid ImageKit document path.'
      );
    });

    it('should reject an invalid URL expiry', async () => {
      await expect(
        downloadEncryptedDocument(VALID_FILE_PATH, 20)
      ).rejects.toThrow(
        'URL expiry must be between 30 and 900 seconds.'
      );
    });

    it('should download encrypted bytes using a signed URL', async () => {
      const encryptedBuffer = Buffer.from('encrypted document bytes');

      const arrayBuffer = encryptedBuffer.buffer.slice(
        encryptedBuffer.byteOffset,
        encryptedBuffer.byteOffset + encryptedBuffer.byteLength
      );

      mockClient.helper.buildSrc.mockReturnValue(
        'https://example.test/signed-document'
      );

      fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: () => String(encryptedBuffer.length),
        },
        arrayBuffer: vi.fn().mockResolvedValue(arrayBuffer),
      });

      const result = await downloadEncryptedDocument(
        VALID_FILE_PATH,
        300
      );

      expect(mockClient.helper.buildSrc).toHaveBeenCalledWith({
        urlEndpoint: 'https://ik.imagekit.io/test-account',
        src: VALID_FILE_PATH,
        signed: true,
        expiresIn: 300,
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://example.test/signed-document',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );

      expect(result).toEqual(encryptedBuffer);
    });

    it('should reject failed ImageKit download responses', async () => {
      mockClient.helper.buildSrc.mockReturnValue(
        'https://example.test/signed-document'
      );

      fetch.mockResolvedValue({
        ok: false,
        status: 403,
      });

      await expect(
        downloadEncryptedDocument(VALID_FILE_PATH)
      ).rejects.toThrow(
        'ImageKit document download failed with status 403.'
      );
    });

    it('should reject an oversized stored document', async () => {
      mockClient.helper.buildSrc.mockReturnValue(
        'https://example.test/signed-document'
      );

      fetch.mockResolvedValue({
        ok: true,
        headers: {
          get: () => String(5 * 1024 * 1024 + 1),
        },
      });

      await expect(
        downloadEncryptedDocument(VALID_FILE_PATH)
      ).rejects.toThrow(
        'Stored document exceeds the maximum allowed size.'
      );
    });
  });
});


import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockFilesDelete,
  mockImageKitConstructor,
} = vi.hoisted(() => ({
  mockFilesDelete: vi.fn(),
  mockImageKitConstructor: vi.fn(),
}));

vi.mock('@imagekit/nodejs', () => ({
  default: mockImageKitConstructor,
  toFile: vi.fn(),
}));

vi.mock('../src/config/env.js', () => ({
  env: {
    IMAGEKIT_PRIVATE_KEY: 'test-private-key',
    IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/test',
    MAX_UPLOAD_MB: 5,
  },
}));

import BillAnalysis from '../src/modules/bills/bill-analysis.model.js';

import {
  deleteStoredDocument,
} from '../src/modules/bills/imagekit-storage.service.js';

describe('Bill deletion prerequisites', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockImageKitConstructor.mockImplementation(function ImageKitMock() {
  return {
    files: {
      delete: mockFilesDelete,
    },
  };
});
  });

  describe('BillAnalysis deletion state', () => {
    it('should default new bill records to active', () => {
      const bill = new BillAnalysis();

      expect(bill.deletionStatus).toBe('active');
      expect(bill.deletionStartedAt).toBeNull();
      expect(bill.storageDeletedAt).toBeNull();
    });

    it('should restrict deletion status to supported lifecycle states', () => {
      const path = BillAnalysis.schema.path('deletionStatus');

      expect(path.enumValues).toEqual([
        'active',
        'deleting',
        'storage_deleted',
      ]);
    });

    it('should define the lead and deletion status index', () => {
      const indexes = BillAnalysis.schema.indexes();

      expect(
        indexes.some(
          ([keys]) =>
            keys.leadId === 1 &&
            keys.deletionStatus === 1
        )
      ).toBe(true);
    });
  });

  describe('deleteStoredDocument', () => {
    it('should delete the ImageKit file successfully', async () => {
      mockFilesDelete.mockResolvedValue(undefined);

      await expect(
        deleteStoredDocument('imagekit-file-123')
      ).resolves.toBeUndefined();

      expect(mockFilesDelete).toHaveBeenCalledWith(
        'imagekit-file-123'
      );
    });

    it('should treat an ImageKit 404 as an already deleted file', async () => {
      mockFilesDelete.mockRejectedValue(
        Object.assign(new Error('File not found.'), {
          status: 404,
        })
      );

      await expect(
        deleteStoredDocument('imagekit-file-123')
      ).resolves.toEqual({
        alreadyDeleted: true,
      });
    });

    it('should propagate other ImageKit errors', async () => {
      const error = Object.assign(
        new Error('ImageKit service unavailable.'),
        { status: 503 }
      );

      mockFilesDelete.mockRejectedValue(error);

      await expect(
        deleteStoredDocument('imagekit-file-123')
      ).rejects.toBe(error);
    });

    it('should reject an invalid file ID', async () => {
      await expect(
        deleteStoredDocument(' ')
      ).rejects.toThrow(
        'A valid ImageKit file ID is required.'
      );

      expect(mockFilesDelete).not.toHaveBeenCalled();
    });
  });
});

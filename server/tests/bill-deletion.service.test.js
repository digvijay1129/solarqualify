import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetAuthorizedBillLead,
  mockDeleteStoredDocument,
  mockRecordBillAuditEvent,
} = vi.hoisted(() => ({
  mockGetAuthorizedBillLead: vi.fn(),
  mockDeleteStoredDocument: vi.fn(),
  mockRecordBillAuditEvent: vi.fn(),
}));

vi.mock('../src/modules/leads/lead.model.js', () => ({
  default: {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('../src/modules/bills/bill-analysis.model.js', () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('../src/modules/bills/bill-access.service.js', () => ({
  getAuthorizedBillLead: mockGetAuthorizedBillLead,
}));

vi.mock('../src/modules/bills/imagekit-storage.service.js', () => ({
  deleteStoredDocument: mockDeleteStoredDocument,
}));

vi.mock('../src/modules/bills/bill-audit.service.js', () => ({
  recordBillAuditEvent: mockRecordBillAuditEvent,
}));

import Lead from '../src/modules/leads/lead.model.js';
import BillAnalysis from '../src/modules/bills/bill-analysis.model.js';

import {
  deleteBillDocument,
} from '../src/modules/bills/bill-deletion.service.js';

const ACTOR_ID = '507f1f77bcf86cd799439011';
const LEAD_ID = '507f1f77bcf86cd799439012';
const BILL_ID = '507f1f77bcf86cd799439013';
const NEW_BILL_ID = '507f1f77bcf86cd799439014';

const homeowner = {
  id: ACTOR_ID,
  role: 'homeowner',
};

const lead = {
  _id: LEAD_ID,
  homeownerId: ACTOR_ID,
  billAnalysisId: BILL_ID,
};

const bill = {
  _id: BILL_ID,
  leadId: LEAD_ID,
  storageProvider: 'imagekit',
  storageFileId: 'imagekit-file-123',
  storagePath:
    '/solarqualify/bills/550e8400-e29b-41d4-a716-446655440000.pdf',
  originalFileName: 'electricity-bill.pdf',
  documentSize: 1024,
  documentType: 'application/pdf',
  verificationStatus: 'pending',
  deletionStatus: 'active',
  deletionStartedAt: null,
  storageDeletedAt: null,
  createdAt: new Date('2026-11-09T00:00:00.000Z'),
};

function mockBillQuery(result) {
  BillAnalysis.findOne.mockImplementation((filter) => {
    const isPendingLookup =
      Object.prototype.hasOwnProperty.call(
        filter ?? {},
        'deletionStatus'
      );

    const queryResult =
      isPendingLookup && result?.deletionStatus === 'active'
        ? null
        : result;

    return {
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(queryResult),
    };
  });
}

function mockBillUpdateResults(results) {
  const queue = [...results];

  BillAnalysis.findOneAndUpdate.mockImplementation(() => ({
    lean: vi.fn().mockResolvedValue(queue.shift() ?? null),
  }));
}

function mockLeadUnlink(result = {
  ...lead,
  billAnalysisId: null,
}) {
  Lead.findOneAndUpdate.mockReturnValue({
    lean: vi.fn().mockResolvedValue(result),
  });
}

function makeClaimedBill(overrides = {}) {
  return {
    ...bill,
    deletionStatus: 'deleting',
    deletionStartedAt: new Date(),
    ...overrides,
  };
}

function makeStorageDeletedBill(overrides = {}) {
  return {
    ...bill,
    deletionStatus: 'storage_deleted',
    storageDeletedAt: new Date(),
    ...overrides,
  };
}

function makeFinalizingBill(overrides = {}) {
  return {
    ...bill,
    deletionStatus: 'deleting',
    storageDeletedAt: new Date(),
    deletionStartedAt: new Date(),
    ...overrides,
  };
}

describe('Bill Deletion Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetAuthorizedBillLead.mockResolvedValue(lead);
    mockDeleteStoredDocument.mockResolvedValue(undefined);
    mockRecordBillAuditEvent.mockResolvedValue({});

    mockBillQuery(bill);

    mockBillUpdateResults([
      makeClaimedBill(),
      makeStorageDeletedBill(),
      makeFinalizingBill(),
    ]);

    mockLeadUnlink();

    BillAnalysis.updateOne.mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
    });

    BillAnalysis.deleteOne.mockResolvedValue({
      acknowledged: true,
      deletedCount: 1,
    });
  });

  it('should delete the ImageKit document and MongoDB bill record', async () => {
    const result = await deleteBillDocument(
      homeowner,
      LEAD_ID
    );

    expect(mockGetAuthorizedBillLead).toHaveBeenCalledWith(
      homeowner,
      LEAD_ID
    );

    expect(mockDeleteStoredDocument).toHaveBeenCalledWith(
      bill.storageFileId
    );

    expect(BillAnalysis.findOneAndUpdate).toHaveBeenCalledTimes(3);

    expect(Lead.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: LEAD_ID,
        homeownerId: ACTOR_ID,
        billAnalysisId: BILL_ID,
      }),
      {
        $set: {
          billAnalysisId: null,
        },
      },
      expect.objectContaining({
        new: true,
        runValidators: true,
      })
    );

    expect(BillAnalysis.deleteOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: BILL_ID,
        leadId: LEAD_ID,
        deletionStatus: 'deleting',
        deletionLockId: expect.any(String),
      })
    );

    expect(result).toEqual({
      billId: BILL_ID,
      leadId: LEAD_ID,
      deleted: true,
    });

    expect(mockRecordBillAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BILL_DELETE_REQUESTED',
        billId: BILL_ID,
        leadId: LEAD_ID,
      })
    );

    expect(mockRecordBillAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BILL_DELETED',
        billId: BILL_ID,
        leadId: LEAD_ID,
      })
    );
  });

  it('should reject when the lead has no bill record', async () => {
    mockGetAuthorizedBillLead.mockResolvedValue({
      ...lead,
      billAnalysisId: null,
    });

    // No interrupted deletion exists for this lead.
    BillAnalysis.findOne.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      deleteBillDocument(homeowner, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Bill document not found.',
    });

    expect(mockDeleteStoredDocument).not.toHaveBeenCalled();
    expect(BillAnalysis.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('should reject when another request owns a fresh deletion lock', async () => {
    mockBillUpdateResults([null]);

    await expect(
      deleteBillDocument(homeowner, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Bill deletion is already in progress. Try again shortly.',
    });

    expect(mockDeleteStoredDocument).not.toHaveBeenCalled();
    expect(BillAnalysis.deleteOne).not.toHaveBeenCalled();
  });

  it('should release the lock and record failure when ImageKit deletion fails', async () => {
    mockBillUpdateResults([makeClaimedBill()]);

    mockDeleteStoredDocument.mockRejectedValue(
      new Error('ImageKit unavailable.')
    );

    await expect(
      deleteBillDocument(homeowner, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 502,
      message: 'Bill document could not be removed from storage. Please retry.',
    });

    expect(BillAnalysis.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: BILL_ID,
        deletionStatus: 'deleting',
        deletionLockId: expect.any(String),
      }),
      {
        $set: {
          deletionStatus: 'active',
          deletionStartedAt: null,
          deletionLockId: null,
        },
      }
    );

    expect(mockRecordBillAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BILL_DELETE_FAILED',
        billId: BILL_ID,
      })
    );

    expect(BillAnalysis.deleteOne).not.toHaveBeenCalled();
  });

  it('should resume without calling ImageKit when storage was already deleted', async () => {
    const checkpointDate = new Date('2026-11-09T08:00:00.000Z');

    const previouslyDeletedBill = {
      ...bill,
      deletionStatus: 'storage_deleted',
      storageDeletedAt: checkpointDate,
    };

    mockBillQuery(previouslyDeletedBill);

    mockBillUpdateResults([
      makeClaimedBill({
        storageDeletedAt: checkpointDate,
      }),
      makeStorageDeletedBill({
        storageDeletedAt: checkpointDate,
      }),
      makeFinalizingBill({
        storageDeletedAt: checkpointDate,
      }),
    ]);

    const result = await deleteBillDocument(
      homeowner,
      LEAD_ID
    );

    expect(mockDeleteStoredDocument).not.toHaveBeenCalled();
    expect(BillAnalysis.deleteOne).toHaveBeenCalled();
    expect(result.deleted).toBe(true);
  });

  it('should not clear a newer bill reference on the lead', async () => {
    mockLeadUnlink(null);

    Lead.findOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: LEAD_ID,
          billAnalysisId: NEW_BILL_ID,
        }),
      }),
    });

    const result = await deleteBillDocument(
      homeowner,
      LEAD_ID
    );

    expect(Lead.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        billAnalysisId: BILL_ID,
      }),
      expect.any(Object),
      expect.any(Object)
    );

    expect(BillAnalysis.deleteOne).toHaveBeenCalled();
    expect(result.deleted).toBe(true);
  });

  it('should record a failed deletion if MongoDB cannot remove the bill record', async () => {
    BillAnalysis.deleteOne.mockResolvedValue({
      acknowledged: true,
      deletedCount: 0,
    });

    await expect(
      deleteBillDocument(homeowner, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 500,
      message: 'Bill metadata could not be removed. Retry the deletion.',
    });

    expect(mockRecordBillAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'BILL_DELETE_FAILED',
        billId: BILL_ID,
        leadId: LEAD_ID,
      })
    );
  });

  it('should reject unauthorized lead access before looking up the bill', async () => {
    mockGetAuthorizedBillLead.mockRejectedValue(
      Object.assign(new Error('Lead not found.'), {
        statusCode: 404,
      })
    );

    await expect(
      deleteBillDocument(homeowner, LEAD_ID)
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(BillAnalysis.findOne).not.toHaveBeenCalled();
    expect(mockDeleteStoredDocument).not.toHaveBeenCalled();
  });

  it('should resume an old deletion instead of deleting a newer linked bill', async () => {
    const checkpointDate = new Date(
      '2026-11-09T08:00:00.000Z'
    );

    const pendingOldBill = {
      ...bill,
      deletionStatus: 'storage_deleted',
      storageDeletedAt: checkpointDate,
    };

    const newerBill = {
      ...bill,
      _id: NEW_BILL_ID,
      storageFileId: 'new-imagekit-file',
      deletionStatus: 'active',
      storageDeletedAt: null,
    };

    mockGetAuthorizedBillLead.mockResolvedValue({
      ...lead,
      billAnalysisId: NEW_BILL_ID,
    });

    BillAnalysis.findOne.mockImplementation((filter) => {
      const pendingLookup =
        Object.prototype.hasOwnProperty.call(
          filter ?? {},
          'deletionStatus'
        );

      return {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(
          pendingLookup ? pendingOldBill : newerBill
        ),
      };
    });

    mockBillUpdateResults([
      makeClaimedBill({
        storageDeletedAt: checkpointDate,
      }),
      makeStorageDeletedBill({
        storageDeletedAt: checkpointDate,
      }),
      makeFinalizingBill({
        storageDeletedAt: checkpointDate,
      }),
    ]);

    mockLeadUnlink(null);

    Lead.findOne.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: LEAD_ID,
          billAnalysisId: NEW_BILL_ID,
        }),
      }),
    });

    const result = await deleteBillDocument(
      homeowner,
      LEAD_ID
    );

    // The pending old record was selected first.
    expect(BillAnalysis.findOne).toHaveBeenCalledTimes(1);

    expect(mockDeleteStoredDocument).not.toHaveBeenCalled();

    // Only the old bill may be removed.
    expect(BillAnalysis.deleteOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: BILL_ID,
      })
    );

    // The newer lead reference must remain untouched.
    expect(Lead.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        billAnalysisId: BILL_ID,
      }),
      expect.any(Object),
      expect.any(Object)
    );

    expect(result).toEqual({
      billId: BILL_ID,
      leadId: LEAD_ID,
      deleted: true,
    });
  });
});
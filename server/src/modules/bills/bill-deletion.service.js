
import { randomUUID } from 'node:crypto';

import Lead from '../leads/lead.model.js';
import BillAnalysis from './bill-analysis.model.js';
import { getAuthorizedBillLead } from './bill-access.service.js';
import {
  deleteStoredDocument,
} from './imagekit-storage.service.js';
import {
  recordBillAuditEvent,
} from './bill-audit.service.js';
import { AppError } from '../../shared/errors/AppError.js';

const DELETION_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

function getLeadOwnershipFilter(user) {
  return user.role === 'homeowner'
    ? { homeownerId: user.id }
    : { assignedSalesStaffId: user.id };
}

async function findBillForDeletion(lead) {
  // Always resume an interrupted deletion before selecting
  // the currently linked bill.
  const pendingQuery = BillAnalysis.findOne({
    leadId: lead._id,
    deletionStatus: {
      $in: ['deleting', 'storage_deleted'],
    },
  });

  const pendingBill = await pendingQuery
    .sort({ createdAt: -1 })
    .lean();

  if (pendingBill) {
    return pendingBill;
  }

  if (!lead.billAnalysisId) {
    return null;
  }

  return BillAnalysis.findOne({
    _id: lead.billAnalysisId,
    leadId: lead._id,
  }).lean();
}

async function recordDeleteFailure(user, lead, bill, originalError) {
  try {
    await recordBillAuditEvent({
      actorId: user.id,
      action: 'BILL_DELETE_FAILED',
      billId: bill._id,
      leadId: lead._id,
      documentType: bill.documentType,
      documentSize: bill.documentSize,
    });
  } catch (auditError) {
    return new AggregateError(
      [originalError, auditError],
      'Bill deletion failed and its failure audit event could not be recorded.'
    );
  }

  return originalError;
}

/**
 * Deletes an authorized bill document using a retryable,
 * two-system deletion lifecycle.
 *
 * ImageKit deletion is completed before the MongoDB reference
 * is removed. The storageDeletedAt checkpoint allows a retry
 * to continue without requiring the file to exist remotely.
 */
export async function deleteBillDocument(user, leadId) {
  const lead = await getAuthorizedBillLead(user, leadId);

  const bill = await findBillForDeletion(lead);

  if (!bill) {
    throw new AppError('Bill document not found.', 404);
  }

  // Record the user's request before changing the deletion state.
  await recordBillAuditEvent({
    actorId: user.id,
    action: 'BILL_DELETE_REQUESTED',
    billId: bill._id,
    leadId: lead._id,
    documentType: bill.documentType,
    documentSize: bill.documentSize,
  });

  const now = new Date();
  const staleBefore = new Date(
    now.getTime() - DELETION_LOCK_TIMEOUT_MS
  );

  const lockId = randomUUID();

  // Only one request may own a fresh deletion lock.
  // Old interrupted requests and storage_deleted records
  // can be claimed again.
  const claimedBill = await BillAnalysis.findOneAndUpdate(
    {
      _id: bill._id,
      leadId: lead._id,
      $or: [
        { deletionStatus: { $in: [null, 'active'] } },
        { deletionStatus: 'storage_deleted' },
        {
          deletionStatus: 'deleting',
          deletionStartedAt: { $lte: staleBefore },
        },
        {
          deletionStatus: 'deleting',
          deletionStartedAt: null,
        },
      ],
    },
    {
      $set: {
        deletionStatus: 'deleting',
        deletionStartedAt: now,
        deletionLockId: lockId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!claimedBill) {
    throw new AppError(
      'Bill deletion is already in progress. Try again shortly.',
      409
    );
  }

  let finalizationLockId;

  try {
    // If storageDeletedAt exists, a previous attempt already
    // confirmed remote deletion. Do not delete it a second time.
    if (!claimedBill.storageDeletedAt) {
      try {
        await deleteStoredDocument(claimedBill.storageFileId);
      } catch (storageError) {
        await BillAnalysis.updateOne(
          {
            _id: claimedBill._id,
            deletionStatus: 'deleting',
            deletionLockId: lockId,
          },
          {
            $set: {
              deletionStatus: 'active',
              deletionStartedAt: null,
              deletionLockId: null,
            },
          }
        );

        throw new AppError(
          'Bill document could not be removed from storage. Please retry.',
          502
        );
      }
    }

    // Persist the remote-deletion checkpoint. This is important
    // because MongoDB and ImageKit cannot share one transaction.
    const checkpoint = await BillAnalysis.findOneAndUpdate(
      {
        _id: claimedBill._id,
        deletionStatus: 'deleting',
        deletionLockId: lockId,
      },
      {
        $set: {
          deletionStatus: 'storage_deleted',
          storageDeletedAt:
            claimedBill.storageDeletedAt || new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!checkpoint) {
      throw new AppError(
        'Bill deletion state changed. Retry the operation.',
        409
      );
    }

    // Acquire a new lock for MongoDB finalization.
    // A concurrent retry can win this transition, but only
    // the winner is allowed to unlink and delete the record.
    finalizationLockId = randomUUID();

    const finalizingBill = await BillAnalysis.findOneAndUpdate(
      {
        _id: claimedBill._id,
        deletionStatus: 'storage_deleted',
        deletionLockId: lockId,
      },
      {
        $set: {
          deletionStatus: 'deleting',
          deletionStartedAt: new Date(),
          deletionLockId: finalizationLockId,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!finalizingBill) {
      throw new AppError(
        'Bill deletion finalization was claimed by another request.',
        409
      );
    }

    // Clear only the exact bill reference being deleted.
    // This prevents an older deletion from clearing a newer upload.
    const unlinkedLead = await Lead.findOneAndUpdate(
      {
        _id: lead._id,
        ...getLeadOwnershipFilter(user),
        billAnalysisId: claimedBill._id,
      },
      {
        $set: {
          billAnalysisId: null,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!unlinkedLead) {
      const currentLead = await Lead.findOne({
        _id: lead._id,
        ...getLeadOwnershipFilter(user),
      })
        .select('_id billAnalysisId')
        .lean();

      if (!currentLead) {
        throw new AppError('Lead not found.', 404);
      }

      // A different bill may have been uploaded after the old
      // bill was unlinked. Never clear that newer reference.
      if (
        currentLead.billAnalysisId &&
        currentLead.billAnalysisId.toString() ===
          claimedBill._id.toString()
      ) {
        throw new AppError(
          'Unable to unlink the bill from this lead.',
          409
        );
      }
    }

    const deletionResult = await BillAnalysis.deleteOne({
      _id: claimedBill._id,
      leadId: lead._id,
      deletionStatus: 'deleting',
      deletionLockId: finalizationLockId,
    });

    if (deletionResult.deletedCount !== 1) {
      throw new AppError(
        'Bill metadata could not be removed. Retry the deletion.',
        500
      );
    }
  } catch (error) {
    throw await recordDeleteFailure(
      user,
      lead,
      claimedBill,
      error
    );
  }

  await recordBillAuditEvent({
    actorId: user.id,
    action: 'BILL_DELETED',
    billId: claimedBill._id,
    leadId: lead._id,
    documentType: claimedBill.documentType,
    documentSize: claimedBill.documentSize,
  });

  return {
    billId: claimedBill._id.toString(),
    leadId: lead._id.toString(),
    deleted: true,
  };
}

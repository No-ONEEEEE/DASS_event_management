const Event = require('../models/Event');

/**
 * Sync event lifecycle statuses based on event dates.
 * Rules:
 * - Draft is never auto-published.
 * - Published/Closed events become Ongoing when start <= now < end.
 * - Published/Closed/Ongoing events become Completed when end <= now.
 */
async function syncEventStatuses() {
  const now = new Date();

  const [ongoingResult, completedResult] = await Promise.all([
    Event.updateMany(
      {
        status: { $in: ['Published', 'Closed'] },
        eventStartDate: { $lte: now },
        eventEndDate: { $gt: now }
      },
      {
        $set: {
          status: 'Ongoing',
          updatedAt: now
        }
      }
    ),
    Event.updateMany(
      {
        status: { $in: ['Published', 'Closed', 'Ongoing'] },
        eventEndDate: { $lte: now }
      },
      {
        $set: {
          status: 'Completed',
          updatedAt: now
        }
      }
    )
  ]);

  return {
    ongoingUpdated: ongoingResult.modifiedCount || 0,
    completedUpdated: completedResult.modifiedCount || 0
  };
}

module.exports = {
  syncEventStatuses
};

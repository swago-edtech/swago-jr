// Channel email order indexes (autoIndex is off, so these were never created).
// Run AFTER the repair dry run confirms duplicates: duplicate gmailMessageIds block the unique index.
//   mongosh "$MONGODB_URI" scripts/indexes/15-channel-indexes.js
// Find duplicates first:
//   db.channelorderevents.aggregate([{$group:{_id:"$gmailMessageId",n:{$sum:1},ids:{$push:"$_id"}}},{$match:{n:{$gt:1}}}])
db.channelorderevents.createIndex({ orderKey: 1 });
db.channelorderevents.createIndex({ externalOrderId: 1 });
db.channelorderevents.createIndex(
  { gmailMessageId: 1 },
  { unique: true, partialFilterExpression: { duplicateOf: null } }
);
db.channelstockledgers.createIndex({ orderKey: 1 });
db.inventorytransactions.createIndex({ channelOpId: 1 }, { sparse: true });
print("channel indexes ok");

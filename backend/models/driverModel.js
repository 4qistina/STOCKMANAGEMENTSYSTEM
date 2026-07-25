const pool = require('../configuration/db');

// Every read of a driver (or the driver list) attaches a computed
// "driverStatus" — this is never stored, it's derived fresh each time from
// isOnShift + whether the driver currently has a delivery that's
// 'Out for Delivery':
//   - 'Delivering' : has an active (Out for Delivery) delivery right now.
//     Takes priority even if isOnShift was just switched off — they're
//     still mid-route.
//   - 'Off Shift'  : isOnShift = false and not currently delivering.
//   - 'Available'  : isOnShift = true and not currently delivering — the
//     only state a driver can be newly assigned a delivery in.
const STATUS_CASE = `
  CASE
    WHEN EXISTS (
      SELECT 1 FROM delivery del
      WHERE del."driverId" = d."driverId" AND del."deliveryStatus" = 'Out for Delivery'
    ) THEN 'Delivering'
    WHEN d."isOnShift" = FALSE THEN 'Off Shift'
    ELSE 'Available'
  END AS "driverStatus"
`;

async function findAll(client = pool) {
  const result = await client.query(
    `SELECT d.*, ${STATUS_CASE} FROM driver d WHERE d."isDeleted" = FALSE ORDER BY d."driverName" ASC`
  );
  return result.rows;
}

async function findById(driverId, client = pool) {
  const result = await client.query(
    `SELECT d.*, ${STATUS_CASE} FROM driver d WHERE d."driverId" = $1`,
    [driverId]
  );
  return result.rows[0];
}

// Fast boolean check used inside the dispatch transaction — whether this
// driver currently has any delivery that's 'Out for Delivery'.
async function isCurrentlyDelivering(driverId, client = pool) {
  const result = await client.query(
    `SELECT 1 FROM delivery WHERE "driverId" = $1 AND "deliveryStatus" = 'Out for Delivery' LIMIT 1`,
    [driverId]
  );
  return result.rowCount > 0;
}

async function insert({ driverName, driverPhoneNumb }, client = pool) {
  const result = await client.query(
    `INSERT INTO driver ("driverName", "driverPhoneNumb") VALUES ($1, $2) RETURNING *`,
    [driverName, driverPhoneNumb]
  );
  return result.rows[0];
}

async function update(driverId, { driverName, driverPhoneNumb }, client = pool) {
  const result = await client.query(
    `UPDATE driver SET "driverName" = $1, "driverPhoneNumb" = $2 WHERE "driverId" = $3 RETURNING *`,
    [driverName, driverPhoneNumb, driverId]
  );
  return result.rows[0];
}

// Clock a driver on/off shift. A driver who's currently 'Delivering' can
// still be switched off here (they'll finish their current route — the
// computed status keeps showing 'Delivering' until they do), but they won't
// be assignable to anything new once off shift.
async function setShift(driverId, isOnShift, client = pool) {
  const result = await client.query(
    `UPDATE driver SET "isOnShift" = $1 WHERE "driverId" = $2 RETURNING *`,
    [isOnShift, driverId]
  );
  return result.rows[0];
}

// Has this driver ever been assigned to a delivery?
async function isReferenced(driverId, client = pool) {
  const result = await client.query(
    'SELECT 1 FROM delivery WHERE "driverId" = $1 LIMIT 1',
    [driverId]
  );
  return result.rowCount > 0;
}

async function softDelete(driverId, client = pool) {
  const result = await client.query(
    'UPDATE driver SET "isDeleted" = TRUE WHERE "driverId" = $1 RETURNING *',
    [driverId]
  );
  return result.rows[0];
}

// Archived (soft-deleted) drivers, so warehouse staff can see and restore them.
async function findDeleted(client = pool) {
  const result = await client.query('SELECT * FROM driver WHERE "isDeleted" = TRUE ORDER BY "driverName" ASC');
  return result.rows;
}

async function restore(driverId, client = pool) {
  const result = await client.query(
    'UPDATE driver SET "isDeleted" = FALSE WHERE "driverId" = $1 RETURNING *',
    [driverId]
  );
  return result.rows[0];
}

async function remove(driverId, client = pool) {
  await client.query('DELETE FROM driver WHERE "driverId" = $1', [driverId]);
}

module.exports = {
  findAll,
  findById,
  isCurrentlyDelivering,
  insert,
  update,
  setShift,
  isReferenced,
  softDelete,
  findDeleted,
  restore,
  remove,
};

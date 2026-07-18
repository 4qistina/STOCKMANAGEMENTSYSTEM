// // Simple role check
// // Expects the caller to send a "role" field in the request body
// // or and "x-role" header. Replace with real auth (JWT/session) later.

// function requireRole(...allowedRoles) {
//     return (req, res, next) => {
//         const role = req.body.role || req.headers['x-role'];

//         if (!role || !allowedRoles.includes(role)) {
//             return res.status(403).json({ error: `Access denied. Requires role: ${allowedRoles.join(' or ')}`});
//         }

//         next();
//     };
// }

// module.exports = { requireRole };
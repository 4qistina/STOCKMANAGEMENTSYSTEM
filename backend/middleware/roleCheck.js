// Role check for routes restricted to a specific role.
// Reads the role from the "x-role" header (set automatically by the
// frontend's fetch patch — see frontend/app/components/ApiRoleHeader.tsx) with a
// fallback to req.body.role for callers that post it directly (e.g. curl/Postman).
// NOTE: this is a role check, not authentication — it trusts whatever role
// the caller claims. Fine for a class project; swap for real JWT/session
// auth before this ever sees real users.

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const role = req.headers['x-role'] || req.body.role;

        if (!role || !allowedRoles.includes(role)) {
            return res.status(403).json({ error: `Access denied. Requires role: ${allowedRoles.join(' or ')}` });
        }

        next();
    };
}

module.exports = { requireRole };
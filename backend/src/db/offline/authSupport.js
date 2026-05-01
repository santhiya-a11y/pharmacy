import { findById } from "../nedb/documentHelpers.js";
import { getWrapped } from "../nedb/initStores.js";
import { toIdString } from "../types.js";

/** Lean shape similar to User.populate("roleId").populate({ path: "employeeId", ... }) */
export async function loadUserWithRoleLean(userId) {
  const users = getWrapped("users");
  const roles = getWrapped("roles");
  const employees = getWrapped("employees");
  const user = await findById(users, userId);
  if (!user) return null;
  const rid = user.roleId ? toIdString(user.roleId) : null;
  const roleDoc = rid ? await findById(roles, rid) : null;
  const roleId =
    roleDoc != null
      ? { _id: roleDoc._id, name: roleDoc.name, permissions: roleDoc.permissions || [] }
      : rid;
  const eid = user.employeeId ? toIdString(user.employeeId) : null;
  const empDoc = eid ? await findById(employees, eid) : null;
  const employeeId =
    empDoc != null
      ? { _id: empDoc._id, name: empDoc.name, employeeCode: empDoc.employeeCode }
      : user.employeeId;
  return { ...user, roleId, employeeId };
}

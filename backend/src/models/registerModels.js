/**
 * Side-effect imports so Mongoose registers all ref targets before populate().
 * Without this, e.g. User.populate("roleId") throws MissingSchemaError for "Role".
 */
import "./Role.js";
import "./Employee.js";

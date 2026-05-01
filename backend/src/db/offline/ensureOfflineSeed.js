import { env } from "../../config/env.js";
import { clearOfflineCollections, executeOfflineSeed } from "../../jobs/seed.js";
import { getWrapped } from "../nedb/initStores.js";

/**
 * When NeDB has no users (fresh Electron userData, new install, etc.), insert demo data
 * so login works without a manual `npm run seed` against that folder.
 */
export async function ensureOfflineSeedIfEmpty() {
  if (env.dbMode !== "offline") return;

  const usersStore = getWrapped("users");
  const userCount = await usersStore.count({});
  if (userCount > 0) return;

  const rolesStore = getWrapped("roles");
  if ((await rolesStore.count({})) > 0) {
    console.warn(
      "[NeDB] Found roles but no users (inconsistent). Clearing offline collections and re-seeding."
    );
    await clearOfflineCollections();
  }

  const pwd =
    process.env.SEED_DEFAULT_PASSWORD ||
    process.env.ELECTRON_DEFAULT_ADMIN_PASSWORD ||
    "Admin@123";

  if (pwd.length < 8) {
    console.error(
      "[NeDB] Cannot auto-seed: set SEED_DEFAULT_PASSWORD (min 8 chars) or ELECTRON_DEFAULT_ADMIN_PASSWORD."
    );
    return;
  }

  if (!process.env.SEED_DEFAULT_PASSWORD && !process.env.ELECTRON_DEFAULT_ADMIN_PASSWORD) {
    console.warn(
      "[NeDB] First-run demo seed using default password Admin@123. Set SEED_DEFAULT_PASSWORD to override."
    );
  }

  await executeOfflineSeed(pwd);
  console.log("[NeDB] Demo data ready. Sign in as admin@pharmacare.in with the seeded password.");
}

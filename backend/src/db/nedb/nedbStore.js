import fs from "fs";
import path from "path";
import Datastore from "@seald-io/nedb";

/**
 * @param {string} filepath Absolute .db path
 */
export function createDatastore(filepath) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  return new Datastore({ filename: filepath, autoload: true });
}

/**
 * Thin promise wrapper around @seald-io/nedb async APIs.
 * @param {InstanceType<typeof Datastore>} ds
 */
export function wrapDatastore(ds) {
  return {
    raw: ds,
    insert(doc) {
      return ds.insertAsync(doc);
    },
    find(query, opts = {}) {
      let c = ds.findAsync(query);
      if (opts.sort && Object.keys(opts.sort).length) c = c.sort(opts.sort);
      if (opts.skip) c = c.skip(opts.skip);
      if (opts.limit != null) c = c.limit(opts.limit);
      return c.execAsync();
    },
    findOne(query, projection = {}) {
      return ds.findOneAsync(query, projection).execAsync();
    },
    count(query) {
      return ds.countAsync(query).execAsync();
    },
    update(query, update, options = {}) {
      return ds.updateAsync(query, update, options);
    },
    remove(query, options = {}) {
      return ds.removeAsync(query, options);
    },
    ensureIndex(options) {
      return ds.ensureIndexAsync(options);
    },
  };
}

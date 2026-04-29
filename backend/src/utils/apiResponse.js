export function success(data, meta = {}) {
  return {
    success: true,
    data,
    meta: meta && Object.keys(meta).length ? meta : {},
  };
}

export function fail(code, message, details) {
  const err = { code, message };
  if (details !== undefined) err.details = details;
  return {
    success: false,
    error: err,
  };
}

import { posSaleBodySchema, posSearchQuerySchema } from "../validators/pos.validators.js";
import { createPosSale } from "../services/posSale.service.js";
import { searchProducts } from "../services/posSearch.service.js";
import { success } from "../utils/apiResponse.js";

export async function postSale(req, res, next) {
  try {
    const body = posSaleBodySchema.parse(req.body);
    const idempotencyKey = req.headers["idempotency-key"];
    const result = await createPosSale({
      ...body,
      userId: req.user.id,
      idempotencyKey,
    });
    return res.status(201).json(
      success(
        { invoice: result.invoice, replay: result.replay },
        { idempotent: Boolean(idempotencyKey) }
      )
    );
  } catch (e) {
    next(e);
  }
}

export async function getProductSearch(req, res, next) {
  try {
    const q = posSearchQuerySchema.parse(req.query);
    const out = await searchProducts({ q: q.q, page: q.page, pageSize: q.pageSize });
    return res.json(success(out.data, out.meta));
  } catch (e) {
    next(e);
  }
}

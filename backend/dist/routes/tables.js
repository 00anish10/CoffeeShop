"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tableController_1 = require("../controllers/tableController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.get('/:qrCode', (0, asyncHandler_1.asyncHandler)(tableController_1.getTableByQrCode));
exports.default = router;
//# sourceMappingURL=tables.js.map
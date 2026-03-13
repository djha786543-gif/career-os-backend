"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const alerts = [];
router.post('/', (req, res) => {
    const { candidate, region, track, filters, email } = req.body;
    alerts.push({ candidate, region, track, filters, email });
    res.json({ status: 'alert registered' });
});
router.get('/check', (_req, res) => { res.json(alerts); });
exports.default = router;

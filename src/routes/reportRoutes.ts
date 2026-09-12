import { Router } from 'express';
import { generateExcelReport, generatePDFReport } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/excel', generateExcelReport);
router.get('/pdf', generatePDFReport);

export default router;

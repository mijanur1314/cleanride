import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { 
  createTicket, 
  getMyTickets, 
  getAllTickets, 
  getTicketDetails, 
  replyToTicket, 
  updateTicketStatus 
} from '../controllers/ticket.controller';

const router = Router();

// Protect all ticket routes
router.use(protect);

// Routes for users
router.post('/', createTicket);
router.get('/my', getMyTickets);

// Route for Admins to get all tickets
router.get('/', restrictTo('ADMIN'), getAllTickets);

// Routes for specific ticket operations
router
  .route('/:id')
  .get(getTicketDetails);

router.post('/:id/reply', replyToTicket);

router.patch('/:id/status', restrictTo('ADMIN'), updateTicketStatus);

export default router;

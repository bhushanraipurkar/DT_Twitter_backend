import express from 'express';
const router = express.Router();

import {
  createUser,
  followUser,
  generateSuggestion,
  getAllUsers,
  getSuggestions,
  getUserByEmail,
  unfollowUser,
} from '../controllers/user';

router.post('/register', createUser); //* working fine
router.get('/all', getAllUsers); //! use less route.
router.get('/get/:email', getUserByEmail);
router.put('/follow/:followerId/:userId', followUser); //* working fine
router.put('/unfollow/:followerId/:userId', unfollowUser); //! use less route
router.get('/feed/:id', generateSuggestion);

export { router };

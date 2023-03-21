import express from 'express';
const router = express.Router();

import {
  createComment,
  createTweet,
  getComments,
  getFollowingTweets,
  getHighImpressionsTweets,
  likeTweet,
} from '../controllers/tweet';

router.post('/add', createTweet); //* done
router.put('/like/:tweetId', likeTweet); //* done
router.post('/comment/:id', createComment); //* done
router.get('/get/comments/:tweetId', getComments); //*done
router.get('/get/feeds/:userId', getFollowingTweets);
router.get('/get/top/feeds', getHighImpressionsTweets);

export { router };

import { Request, Response } from 'express';
import { User } from '../models/user';
import { Tweet } from '../models/tweet';
import { Comment } from '../models/comment';
import { userDoc } from '../types/User';
import { tweetDoc } from '../types/Tweet';
import { sendFailureResponse, sendSuccessResponse } from '../utils/response';
import { getConnection, releaseConnection } from '../config/db';
import { Mongoose } from 'mongoose';
import { commentDoc, DetailedComment } from '../types/Comment';

export const createTweet = async (req: Request, res: Response) => {
  const { reference, author } = req.body;
  let connection: Mongoose | undefined;
  const newTweet: tweetDoc = new Tweet({
    reference,
    author,
  });

  try {
    connection = await getConnection();
    const user = await User.findById(author);
    if (!user) {
      if (connection) await releaseConnection(connection);
      return sendFailureResponse(res, 'Invalid User.');
    }
    await newTweet.save();
    await releaseConnection(connection);
    return sendSuccessResponse<tweetDoc | null>(
      res,
      newTweet,
      'Tweet created successfully'
    );
  } catch (err) {
    console.error(err);
    if (connection) {
      await releaseConnection(connection);
    }
    return sendFailureResponse(res, 'Something went wrong.');
  }
};

export const likeTweet = async (req: Request, res: Response) => {
  const { tweetId } = req.params;
  const { userId } = req.body;
  let connection: Mongoose | undefined;

  try {
    connection = await getConnection();
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      await releaseConnection(connection);
      return sendFailureResponse(res, 'Tweet not found.');
    }

    let status: string;

    const index = tweet.likes.indexOf(userId);
    if (index !== -1) {
      status = 'disliked';
      tweet.likes.splice(index, 1);
    } else {
      status = 'liked';
      tweet.likes.push(userId);
    }

    await tweet.save();
    await releaseConnection(connection);
    return sendSuccessResponse(res, tweet, `Tweet ${status} successfully.`);
  } catch (err) {
    if (connection) {
      await releaseConnection(connection);
    }
    console.log(err);
    sendFailureResponse(res, 'Error while liking tweet.');
  }
};

export const createComment = async (req: Request, res: Response) => {
  const tweetId = req.params.id;
  const { text, userId } = req.body;
  let connection: Mongoose | undefined;
  try {
    connection = await getConnection();
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      await releaseConnection(connection);
      return sendFailureResponse(res, 'Tweet not found.');
    }

    const comment = await Comment.create({
      text,
      author: userId,
      tweet: tweetId,
    });

    tweet.comments.push(comment._id);
    await tweet.save();
    await releaseConnection(connection);
    return sendSuccessResponse(res, comment, 'Comment created');
  } catch (err) {
    if (connection) {
      await releaseConnection(connection);
    }
    console.log(err);
    return sendFailureResponse(res, 'Server error.');
  }
};

export const getComments = async (req: Request, res: Response) => {
  const { tweetId } = req.params;
  let connection: Mongoose | undefined;

  try {
    connection = await getConnection();
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new Error('Tweet not found');
    }
    const comments = await Comment.find({ tweet: tweet }).populate(
      'author likes'
    );

    const detailedComments: DetailedComment[] = await Promise.all(
      comments.map(async (comment: commentDoc) => {
        const author = (await User.findById(comment.author)) as userDoc;
        const likes = (await User.find({
          _id: { $in: comment.likes },
        })) as userDoc[];
        return {
          id: comment._id.toString(),
          text: comment.text,
          author: {
            id: author?._id.toString(),
            name: author?.name,
            email: author?.email,
            imageUrl: author?.imageUrl,
          },
          likes: likes.map((user) => ({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
          })),
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        };
      })
    );
    await releaseConnection(connection);
    return sendSuccessResponse(
      res,
      detailedComments,
      'Retrieved all comments.'
    );
  } catch (error) {
    if (connection) {
      await releaseConnection(connection);
    }
    console.error(error);
    return sendFailureResponse(res, 'Something went wrong.');
  }
};

export const getFollowingTweets = async (req: Request, res: Response) => {
  const { userId } = req.params;
  let connection: Mongoose | undefined;
  try {
    connection = await getConnection();
    const user: userDoc | null = await User.findById(userId);
    if (!user) {
      await releaseConnection(connection);
      return sendFailureResponse(res, 'User not found.');
    }
    const followings = user.following;
    const tweets = await Tweet.find({ author: { $in: followings } })
      .sort({ createdAt: -1 })
      .populate('author')
      .populate('comments');
    sendSuccessResponse<tweetDoc[]>(res, tweets, 'Following tweets retrieved.');
  } catch (error) {
    if (connection) {
      await releaseConnection(connection);
    }
    console.log(error);
    sendFailureResponse(res, 'Error while retrieving following tweets.');
  }
};

export const getHighImpressionsTweets = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1; // default to page 1 if not provided
  const limit = 10; // limit number of results per page
  let connection: Mongoose | undefined;
  try {
    connection = await getConnection();
    const tweets: tweetDoc[] | null = await Tweet.find()
      .sort({ likes: -1, createdAt: -1 }) // sort by likes and createdAt
      .skip((page - 1) * limit) // skip results for previous pages
      .limit(limit) // limit results for current page
      .populate('user', '_id name email') // populate user data for each tweet
      .exec();

    const totalCount = await Tweet.countDocuments(); // get total count of tweets
    const totalPages = Math.ceil(totalCount / limit); // calculate total pages based on limit
    await releaseConnection(connection);
    return sendSuccessResponse(
      res,
      {
        tweets,
        page,
        totalPages,
      },
      'Tweets with high impressions retrieved successfully.'
    );
  } catch (err) {
    if (connection) {
      await releaseConnection(connection);
    }
    console.error(err);
    return sendFailureResponse(
      res,
      'Error while retrieving tweets with high impressions.'
    );
  }
};

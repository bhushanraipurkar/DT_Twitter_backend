import { Request, Response } from 'express';
import { User } from '../models/user';
import { userDoc } from '../types/User';
import { sendFailureResponse, sendSuccessResponse } from '../utils/response';
import { userSchema } from '../utils/validator';
import { getConnection, releaseConnection } from '../config/db';
import { Mongoose, ObjectId } from 'mongoose';
import mongoose from 'mongoose';
import _ from 'lodash';

export const createUser = async (req: Request, res: Response) => {
  const { error, value } = userSchema.validate(req.body);
  let connection: Mongoose | undefined;
  if (error) {
    return sendFailureResponse(res, error.details[0].message);
  }
  try {
    connection = await getConnection();
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      releaseConnection(connection);
      return sendSuccessResponse<userDoc | null>(
        res,
        null,
        'User already exists.'
      );
    }
    const user = new User(value);
    await user.save();
    releaseConnection(connection);
    return sendSuccessResponse<userDoc | null>(res, null, 'User created.');
  } catch (err) {
    if (connection) {
      await releaseConnection(connection);
    }
    console.log(err);
    return sendFailureResponse(res, 'Error while creating user.');
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  let connection: Mongoose | undefined;
  try {
    connection = await getConnection();
    const users: userDoc[] = await User.find({});
    releaseConnection(connection);
    // res.status(200).json(users);
    return sendSuccessResponse<userDoc[] | null>(
      res,
      users,
      'All user retrieved.'
    );
  } catch (error) {
    if (connection) {
      await releaseConnection(connection);
    }
    console.error(error);
    // res.status(500).json({ message: 'Internal server error' });
    return sendFailureResponse(res, 'Internal server error');
  }
};

// export const followUser = async (req: Request, res: Response) => {
//   const { userId, followerId } = req.params;

//   // Check if both userId and followerId are valid objectIds
//   if (
//     !mongoose.isValidObjectId(userId) ||
//     !mongoose.isValidObjectId(followerId)
//   ) {
//     return sendFailureResponse(res, 'Invalid userId or followerId.');
//   }

//   // Check if the user exists in the database
//   const user: userDoc | null = await User.findById(userId);
//   if (!user) {
//     return sendFailureResponse(res, 'User not found.');
//   }

//   // Check if the follower exists in the database
//   const follower = await User.findById(followerId);
//   if (!follower) {
//     return sendFailureResponse(res, 'Follower not found.');
//   }

//   // Check if the follower is already following the user
//   const isFollowing = user.followers.includes(followerId as any);
//   if (isFollowing) {
//     // If the follower is already following the user, remove them from the following array
//     const index = user.followers.indexOf(followerId as any);
//     user.followers.splice(index, 1);
//     await user.save();
//     return sendSuccessResponse(res, null, 'Unfollowed successfully.');
//   } else {
//     // If the follower is not already following the user, add them to the following array
//     user.followers.push(followerId as any);
//     await user.save();
//     return sendSuccessResponse(res, null, 'Followed successfully.');
//   }
// };

export const followUser = async (req: Request, res: Response) => {
  const { followerId, userId } = req.params;
  let connection: Mongoose | undefined;

  if (followerId === userId) {
    return sendFailureResponse(res, 'You cannot follow yourself.');
  }
  const session = await mongoose.startSession();

  try {
    connection = await getConnection();
    const follower = await User.findById(followerId);
    const user = await User.findById(userId);

    if (!follower) {
      return sendFailureResponse(res, 'Follower not found.');
    }
    if (!user) {
      return sendFailureResponse(res, 'User not found.');
    }

    const isFollowing = user.followers.includes(followerId as any);
    session.startTransaction();
    if (isFollowing) {
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: followerId },
      });
      await User.findByIdAndUpdate(followerId, {
        $pull: { following: userId },
      });
      await session.commitTransaction();
      session.endSession();
      await releaseConnection(connection);
      return sendSuccessResponse(res, null, 'Unfollowed user.');
    } else {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { followers: followerId },
      });
      await User.findByIdAndUpdate(followerId, {
        $addToSet: { following: userId },
      });
      await session.commitTransaction();
      session.endSession();
      await releaseConnection(connection);
      return sendSuccessResponse(res, null, 'Followed user.');
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (connection) {
      await releaseConnection(connection);
    }
    console.log(error);
    return sendFailureResponse(res, 'Error while following user.');
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  const { followerId, userId } = req.params;
  let connection: Mongoose | undefined;

  if (followerId === userId) {
    return sendFailureResponse(res, 'You cannot unfollow yourself.');
  }

  const session = await mongoose.startSession();

  try {
    connection = await getConnection();
    const follower = await User.findById(followerId);
    const user = await User.findById(userId);

    if (!follower) {
      return sendFailureResponse(res, 'Follower not found.');
    }
    if (!user) {
      return sendFailureResponse(res, 'User not found.');
    }

    const isFollowing = user.followers.includes(followerId as any);

    session.startTransaction();
    if (isFollowing) {
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: followerId },
      });
      await User.findByIdAndUpdate(followerId, {
        $pull: { following: userId },
      });
      await session.commitTransaction();
      session.endSession();
      return sendSuccessResponse(res, null, 'Unfollowed user.');
    } else {
      await session.commitTransaction();
      session.endSession();
      await releaseConnection(connection);
      return sendSuccessResponse(res, null, 'User is not being followed.');
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (connection) {
      await releaseConnection(connection);
    }
    console.log(error);
    return sendFailureResponse(res, 'Error while unfollowing user.');
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
  const userId = req.params;
  let connection: Mongoose | undefined;
  try {
    connection = await getConnection();
    const users = await User.aggregate([
      // Match users who are not already followed by the authenticated user
      {
        $match: {
          _id: { $ne: userId },
          followers: { $nin: [userId] },
        },
      },
      // Sort users by creation date and number of followers
      {
        $sort: {
          createdAt: -1,
          followersCount: -1,
        },
      },
      // Limit the results to 10 users
      {
        $limit: 10,
      },
    ]);
    await releaseConnection(connection);
    sendSuccessResponse<userDoc[]>(res, users, 'Suggested users retrieved.');
  } catch (err) {
    if (connection) {
      await releaseConnection(connection);
    }
    console.log(err);
    sendFailureResponse(res, 'Error while retrieving suggested users.');
  }
};

export const generateSuggestion = async (req: Request, res: Response) => {
  const { id } = req.params;
  let connection: Mongoose | undefined;
  try {
    connection = await getConnection();

    const currentUser: userDoc | null = await User.findById(id).exec();
    if (currentUser == null) {
      await releaseConnection(connection);
      return sendFailureResponse(res, 'please use a valid user id.');
    }
    const followingIds = currentUser.following.map((user) => user._id);
    const suggestedUsers = await User.find({
      _id: { $nin: followingIds },
    }).exec();

    const maxFollowers = await User.find()
      .sort({ followers: -1 })
      .limit(10)
      .select('_id name email imageUrl followers following')
      .exec();

    const oldUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id name email imageUrl followers following')
      .exec();

    const shuffledUsers: {
      _id: string;
      name: string;
      email: string;
      imageUrl: string;
      followers: number;
      following: number;
    }[] = _.shuffle(suggestedUsers)
      .slice(0, 10)
      .map(
        (user: {
          _id: any;
          name: any;
          email: any;
          imageUrl: any;
          followers: string | any[];
          following: string | any[];
        }) => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
          followers: user.followers.length,
          following: user.following.length,
        })
      );
    await releaseConnection(connection);
    return sendSuccessResponse(
      res,
      {
        suggestedUsers: shuffledUsers,
        popularUsers: maxFollowers,
        oldUsers: oldUsers,
      },
      'done.'
    );
  } catch (error) {
    if (connection) {
      await releaseConnection(connection);
    }
    console.log(error);
    return sendFailureResponse(res, 'Something went wrong !');
  }
};

import { Document, Types } from 'mongoose';
import { commentDoc } from './Comment';
import { userDoc } from './User';

export interface tweetDoc extends Document {
  reference: string;
  author: Types.ObjectId | userDoc;
  likes: Types.ObjectId[] | userDoc[];
  retweets: Types.ObjectId[] | userDoc[];
  comments: Types.ObjectId[] | commentDoc[];
}

export interface tweetWithPagination extends tweetDoc {
  tweets: tweetDoc[];
  page: number;
  totalPages: number;
}

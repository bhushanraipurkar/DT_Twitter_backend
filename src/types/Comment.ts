import { Document, Types } from 'mongoose';
import { tweetDoc } from './Tweet';
import { userDoc } from './User';

export interface commentDoc extends Document {
  text: string;
  author: Types.ObjectId | userDoc;
  tweet: Types.ObjectId | tweetDoc;
  likes: Types.ObjectId[] | userDoc[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DetailedComment {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    email: string;
    imageUrl: string;
  };
  likes: {
    id: string;
    name: string;
    email: string;
    imageUrl: string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

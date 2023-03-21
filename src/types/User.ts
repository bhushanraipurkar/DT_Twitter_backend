import { Document, Types } from 'mongoose';

export interface userDoc extends Document {
  name: string;
  email: string;
  imageUrl: string;
  followers: Types.ObjectId[] | userDoc[];
  following: Types.ObjectId[] | userDoc[];
}

import { Schema, model } from 'mongoose';
import { tweetDoc } from '../types/Tweet';

const tweetSchema = new Schema<tweetDoc>(
  {
    reference: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    retweets: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  },
  {
    timestamps: true,
  }
);

const Tweet = model<tweetDoc>('Tweet', tweetSchema);
export { Tweet };

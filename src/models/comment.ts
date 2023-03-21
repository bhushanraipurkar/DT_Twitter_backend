import { Schema, model } from 'mongoose';
import { userDoc } from '../types/User';
import { commentDoc } from '../types/Comment';

const commentSchema = new Schema<commentDoc>(
  {
    text: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    tweet: { type: Schema.Types.ObjectId, ref: 'Tweet' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

const Comment = model<commentDoc>('Comment', commentSchema);
export { Comment };

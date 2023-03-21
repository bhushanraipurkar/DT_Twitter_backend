import { Schema, model } from 'mongoose';
import { userDoc } from '../types/User';

const userSchema = new Schema<userDoc>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

const User = model<userDoc>('User', userSchema);
export { User };

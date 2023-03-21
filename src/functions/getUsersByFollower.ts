import { User } from '../models/user';
import { userDoc } from '../types/User';

async function getUsersWithHighestFollowerCount(): Promise<userDoc[]> {
  const users = await User.aggregate([
    {
      $project: {
        name: 1,
        email: 1,
        imageUrl: 1,
        followerCount: { $size: '$followers' }, // add a computed field 'followerCount'
      },
    },
    { $sort: { followerCount: -1 } }, // sort by 'followerCount' in descending order
  ]);
  return users;
}

export { getUsersWithHighestFollowerCount };

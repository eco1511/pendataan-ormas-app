import 'dotenv/config';
import { connectMongoDB, mongoose } from '@/lib/mongodb';
import { User } from '@/models/User';

async function main() {
  await connectMongoDB();
  const users = await User.find({}, 'username role status').lean();
  console.log('Total users:', users.length);
  console.log('Users:', JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

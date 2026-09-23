import 'dotenv/config';
import { connectMongoDB, mongoose } from '@/lib/mongodb';
async function main(){await connectMongoDB();console.log({database:mongoose.connection.name,host:mongoose.connection.host,port:mongoose.connection.port,readyState:mongoose.connection.readyState});await mongoose.disconnect();}
main().catch(e=>{console.error(e);process.exit(1)});

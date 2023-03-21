import mongoose, { Mongoose } from 'mongoose';
import { createPool, Pool } from 'generic-pool';
const MONGO_URL = 'mongodb://localhost:27017/twitter';

interface PoolConfig {
  max?: number;
  min?: number;
  testOnBorrow?: boolean;
  acquireTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  evictionRunIntervalMillis?: number;
  numTestsPerRun?: number;
  softIdleTimeoutMillis?: number;
  Promise?: any;
}

const mongoConfig: PoolConfig = {
  max: 10,
  min: 1,
  idleTimeoutMillis: 30000,
  acquireTimeoutMillis: 30000,
  testOnBorrow: true,
};

// const createMongooseConnection = async (): Promise<Mongoose> => {
//   const connection = await mongoose.connect(MONGO_URL);
//   return connection;
// };

const createMongooseConnection = async (): Promise<Mongoose> => {
  try {
    const connection = await mongoose.connect(MONGO_URL);
    console.log('MongoDB connection successful');
    return connection;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    throw error;
  }
};

function validate(connection: typeof mongoose): Promise<boolean> {
  return Promise.resolve(connection.connection.readyState === 1);
}

const mongoosePool: Pool<Mongoose> = createPool(
  {
    create: createMongooseConnection,
    destroy: (connection: Mongoose) => connection.disconnect(),
    validate: validate,
  },
  mongoConfig
);

const getConnection = async (): Promise<Mongoose> => {
  return await mongoosePool.acquire();
};

const releaseConnection = async (connection: Mongoose): Promise<void> => {
  await mongoosePool.release(connection);
};

export { getConnection, releaseConnection };

import mongoose from 'mongoose';
import logger from 'jet-logger';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URL || 'mongodb://localhost:27017/eflix';
  try {
    await mongoose.connect(mongoUri);
    logger.info(`MongoDB connected successfully at: ${mongoUri}`);
  } catch (error) {
    logger.err(`MongoDB connection error: ${error}`);
    process.exit(1);
  }
};

export default connectDB;

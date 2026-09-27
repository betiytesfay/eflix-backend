import logger from 'jet-logger';

import EnvVars from './common/constants/env';
import server from './server';
import { connectDB } from './config/db';

/******************************************************************************
                                Constants
******************************************************************************/

const SERVER_START_MESSAGE =
  'Express server started on port: ' + EnvVars.Port.toString();

/******************************************************************************
                                  Run
******************************************************************************/

const startServer = async (): Promise<void> => {
  await connectDB();

  server.listen(EnvVars.Port, (err) => {
    if (!!err) {
      logger.err(err.message);
    } else {
      logger.info(SERVER_START_MESSAGE);
    }
  });
};

void startServer();

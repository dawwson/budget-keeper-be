import { registerAs } from '@nestjs/config';
import { DB_CONFIG_TOKEN } from './db.constant';

export default registerAs(DB_CONFIG_TOKEN, () => {
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  };
});

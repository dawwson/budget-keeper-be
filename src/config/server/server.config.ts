import { registerAs } from '@nestjs/config';
import { SERVER_CONFIG_TOKEN } from './server.constant';

export default registerAs(SERVER_CONFIG_TOKEN, () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    port: parseInt(process.env.SERVER_PORT),
    domain: process.env.DOMAIN,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN), // 단위: 초
    logDir: process.env.LOG_DIR,
    webhookUrl: process.env.WEBHOOK_URL,
  };
});

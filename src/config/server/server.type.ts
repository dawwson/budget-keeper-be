export enum NodeEnv {
  DEV = 'dev',
  PROD = 'prod',
  TEST = 'test',
}

export interface ServerConfig {
  nodeEnv: NodeEnv;
  port: number;
  domain: string;
  jwtSecret: string;
  jwtExpiresIn: number;
  logDir: string;
  webhookUrl: string;
}

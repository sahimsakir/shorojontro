import { env } from 'cloudflare:workers';
export function rawDb(){if(!env.DB)throw Error('The game server is temporarily unavailable. Please try again.');return env.DB;}

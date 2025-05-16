import { env } from "$env/dynamic/public";

export const SERVER_URL = env.PUBLIC_SERVER_URL ?? "localhost:8079";

import cloudbase from "@cloudbase/node-sdk";

let app: ReturnType<typeof cloudbase.init> | null = null;

export function getCloudBase() {
  if (!app) {
    app = cloudbase.init({
      env: process.env.TCB_ENV_ID!,
      secretId: process.env.TCB_SECRET_ID!,
      secretKey: process.env.TCB_SECRET_KEY!,
    });
  }
  return app;
}

export function getDb() {
  return getCloudBase().database();
}

import {userInfo} from 'node:os';

/** STAGE from the environment, else the OS username, cleaned up so teammates' stacks don't collide. */
export function stageName(): string {
  let raw = process.env.STAGE ?? '';
  if (!raw) {
    try {
      raw = userInfo().username;
    } catch {
      raw = 'dev';
    }
  }
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || 'dev'
  );
}

export const stackName = (stage: string) => `Nightlight-${stage}`;

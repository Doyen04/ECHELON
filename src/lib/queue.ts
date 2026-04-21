import { Client } from "@upstash/qstash";

export type NotifyJobPayload = {
  dispatchId: string;
  studentResultId: string;
};

export type EnqueueResult = {
  queued: boolean;
  reason?: string;
};

export async function enqueueNotifyJob(payload: NotifyJobPayload): Promise<EnqueueResult> {
  const token = process.env.QSTASH_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token || !appUrl) {
    return {
      queued: false,
      reason: "QStash is not configured; falling back to inline execution.",
    };
  }

  const client = new Client({ token });
  const headers = process.env.WORKER_SHARED_SECRET
    ? { "x-worker-secret": process.env.WORKER_SHARED_SECRET }
    : undefined;

  await client.publishJSON({
    url: `${appUrl}/api/workers/notify`,
    body: payload,
    headers,
  });

  return { queued: true };
}

import "dotenv/config";
import { CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { storageBucket, storageClient } from "../src/lib/storage";

async function main() {
  const endpoint = new URL(process.env.S3_ENDPOINT || "http://localhost:9000");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)) {
    throw new Error("This initializer is for local storage only. Configure R2 through Cloudflare.");
  }
  const client = storageClient();
  const Bucket = storageBucket();
  try {
    await client.send(new HeadBucketCommand({ Bucket }));
  } catch (error) {
    if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode !== 404) throw error;
    await client.send(new CreateBucketCommand({ Bucket }));
  }
  // MinIO's browser CORS origin is configured in compose.storage.yml.
  console.log(`Local bucket ${Bucket} is ready.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

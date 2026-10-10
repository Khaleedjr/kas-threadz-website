import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { signedIn } from "@/lib/studio-auth";

/*
 * Photo uploads from the desk go straight from the browser to Vercel Blob;
 * this only hands out the permission to do it, and only to the signed-in
 * studio: one photo, at the path asked for, for ten minutes.
 *
 * Works with a Blob store connected in the Storage tab either way Vercel
 * connects one: the newer BLOB_STORE_ID with BLOB_WEBHOOK_PUBLIC_KEY, or the
 * older BLOB_READ_WRITE_TOKEN.
 */

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 15 * 1024 * 1024;
const VALID_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  if (!(await signedIn())) return Response.json({ error: "Sign in to the studio first." }, { status: 401 });
  try {
    const body = (await request.json()) as HandleUploadPresignedBody;
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        // the desk only ever puts photos in its own folder
        if (!pathname.startsWith("studio/")) throw new Error("Photos go in the studio's own folder.");
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: TYPES,
          maximumSizeInBytes: MAX_BYTES,
          validUntil: Date.now() + VALID_MS,
        });
        // a random tail, so a second photo with the same file name never replaces the first
        return { token, urlOptions: { addRandomSuffix: true, allowedContentTypes: TYPES, maximumSizeInBytes: MAX_BYTES } };
      },
    });
    return Response.json(result);
  } catch (err) {
    // the browser only hears that it failed, so the reason goes to the host's logs
    console.error("A studio photo upload was refused.", err);
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}

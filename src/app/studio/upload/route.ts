import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { signedIn } from "@/lib/studio-auth";

/*
 * Photo uploads from the desk go straight from the browser to Vercel Blob;
 * this only hands out the permission to do it, and only to the signed-in
 * studio. Needs a Blob store connected (Storage tab), which sets
 * BLOB_READ_WRITE_TOKEN.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await signedIn())) throw new Error("Sign in to the studio first.");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}

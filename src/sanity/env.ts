/*
 * Which Sanity project holds the site's editable content. Neither value is
 * secret: the project is read-only to the public, and only its members can
 * sign in to change it. Set both in the host's environment variables.
 */

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2025-01-01";

/** Whether a Sanity project has been connected at all. */
export const sanityConnected = projectId.length > 0;

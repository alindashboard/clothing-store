/**
 * Upload size limit, shared by the Server Actions that enforce it and the client
 * components that pre-check against it.
 *
 * Kept below Vercel's 4.5MB serverless request-body cap, which no config can
 * raise: a body over that is rejected at the platform edge before the Server
 * Action runs, so the user would see a network error instead of our message.
 * next.config.ts serverActions.bodySizeLimit must stay >= this value.
 */
export const MAX_UPLOAD_SIZE = 4 * 1024 * 1024
export const MAX_UPLOAD_SIZE_LABEL = '4MB'

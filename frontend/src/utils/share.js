/**
 * Builds the canonical public share URL for a token.
 * Uses the current origin in development; production can set VITE_PUBLIC_SHARE_BASE.
 */
export const buildPublicShareUrl = (token) => {
  const base = import.meta.env.VITE_PUBLIC_SHARE_BASE || window.location.origin;
  return `${base.replace(/\/$/, '')}/share/${token}`;
};

export const copyPublicShareLink = async (token) => {
  const link = buildPublicShareUrl(token);
  await navigator.clipboard.writeText(link);
  return link;
};

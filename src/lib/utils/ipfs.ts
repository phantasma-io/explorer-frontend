export const resolveIpfs = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${url.slice(7)}`;
  }
  return url;
};

const CROWN_SYMBOL = "CROWN";

export const CROWN_FULL_VIDEO_URL =
  "https://cdn.ghostmarket.io/thumbs/QmcwvicfK5p1apJsmoad9fbP66zXGWZSMc7zZr4jtRVmU3";

export const CROWN_PREVIEW_IMAGE_URL = "https://phantasma.info/img/crown.png";

export const isCrownSymbol = (value?: string | null) => {
  return (value ?? "").trim().toUpperCase() === CROWN_SYMBOL;
};


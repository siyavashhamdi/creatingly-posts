import { ScreenColumn } from "../enums";

export const getWindowHeight = () => {
  return window.innerHeight;
};

export const getScreenColumn = () => {
  if (window.innerWidth < 480) {
    return ScreenColumn.MOBILE;
  } else if (window.innerWidth > 481 && window.innerWidth < 768) {
    return ScreenColumn.TABLET;
  } else if (window.innerWidth > 769 && window.innerWidth < 1024) {
    return ScreenColumn.SMALL_SCREEN;
  } else if (window.innerWidth > 1025 && window.innerWidth < 1200) {
    return ScreenColumn.LARGE_SCREEN;
  }

  return ScreenColumn.EXTRA_LARGE_SCREEN;
};

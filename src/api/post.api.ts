import { Constant } from "../constants";
import { IPost } from "../interfaces";

export const fetchNewPosts = async (
  numOfPosts = 10,
  delayMs = 2000
): Promise<IPost[]> => {
  console.log("API CALLING...");

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        [...Array(numOfPosts).keys()].map(() => {
          const uniqueId = Math.floor(Math.random() * 1000000000).toString(16);

          return {
            key: uniqueId,
            text: `#${uniqueId.substring(0, 6)}`,
            color: `#${uniqueId.substring(0, 6)}`,
            hideMs: 2000,
            height: Math.floor(
              Constant.POST_MIN_HEIGHT_PX +
                Math.random() *
                  (Constant.POST_MAX_HEIGHT_PX - Constant.POST_MIN_HEIGHT_PX)
            ),
          };
        })
      );
    }, delayMs);
  });
};

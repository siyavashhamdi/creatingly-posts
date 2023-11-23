import { useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { getScreenColumn, getWindowHeight } from "../../helpers";
import { ScreenColumn } from "../../enums";
import { IPost } from "../../interfaces";
import { Constant } from "../../constants";
import { fetchNewPosts } from "../../api";
import { Post } from "../../components";

function App() {
  // To see which screen is used: mobile, tablet, ...
  const [screenColumn, setScreenColumn] = useState<ScreenColumn>();

  // To fetch new data from the api
  const [hasMore, setHasMore] = useState(false);

  // The main data of the posts in the page. It is a 2D array. The first dimension for the column index, and the next dimension for column data
  const [posts, setPosts] = useState<IPost[][]>(
    Array.from({ length: getScreenColumn() }, () => [])
  );

  // A repository to store the posts temporary in to that in order to optimeze the calls if we get more than neede ones from the api fetch
  const postsRepository = useRef<IPost[]>([]);

  // To indicates how many fetches are done up to now
  const loadCount = useRef<number>(0);

  /**
   * Checks whether there are data with the needed number of posts available in the repository or not
   * Data maybe old (for the previous call, for example), because in some cases the API fetches more than needed (it's approximate fetch)
   * @returns Fetched posts
   */
  const getNewPostsFromRepository = async (): Promise<IPost[]> => {
    const neededPostCount = getNewPostCountByRatioToFetch();

    if (postsRepository.current.length < neededPostCount) {
      const fetchedPosts = await fetchNewPosts(
        neededPostCount,
        Constant.API_ARTIFICIAL_DELAY_MS
      );

      postsRepository.current = [...postsRepository.current, ...fetchedPosts];
    }

    return postsRepository.current;
  };

  /**
   * Calculates the ration of empty spaces + the needed one that comes from the constant variable
   * This can be helpful in order not to get more data from the API fetch
   * @returns the number of post to be fetched from the API
   */
  const getNewPostCountByRatioToFetch = () => {
    const averagePostHeight = Math.ceil(
      (Constant.POST_MIN_HEIGHT_PX + Constant.POST_MAX_HEIGHT_PX) / 2
    );

    const remainingHeights = getColRemainingHeights(posts);

    const totalRemainingHeights = remainingHeights.reduce(
      (prev, curr) => prev + curr
    );

    return Math.ceil(totalRemainingHeights / averagePostHeight);
  };

  /**
   * Calculates the remaining height of each column (each dimension) in the `posts`
   * @param targetPosts Posts that being processed on
   * @returns An array indicates the remaining heights of each col in the page
   */
  const getColRemainingHeights = (targetPosts: IPost[][]) => {
    const res: number[] = [];

    const usedPostsHeight = targetPosts.map(
      (targetPost) =>
        targetPost
          .map((post) => post.height + Constant.POST_MARGIN_HEIGHT_PX)
          .reduce((prev, curr) => prev + curr, 0) -
        Constant.POST_MARGIN_HEIGHT_PX
    );

    const maxUsedPostsHeight =
      Math.max(...usedPostsHeight) < 0 ? 0 : Math.max(...usedPostsHeight);

    for (const targetPost of targetPosts) {
      const PostHeight = targetPost
        .map((post) => post.height)
        .reduce((prev, curr) => prev + curr, 0);

      const marginsHeight = targetPost.length
        ? (targetPost.length - 1) * Constant.POST_MARGIN_HEIGHT_PX
        : 0;

      const totalElementHeights = PostHeight + marginsHeight;

      const remainingHeight =
        maxUsedPostsHeight < getWindowHeight()
          ? getWindowHeight() - totalElementHeights
          : maxUsedPostsHeight -
            totalElementHeights +
            Constant.EXTENSION_HEIGHT_PX;

      res.push(remainingHeight);
    }

    return res;
  };

  /**
   * After the scrollbar reached to the end (with a threshold, this method will be fired.
   * The current candidate post employs a strategy that prioritizes the best fit within the columns. This approach determines the optimal
   * placement of the current post in one of the available columns with sufficient space.
   * @param numberOfLoads Based on this, it recognize what should be the height for all of the columns
   */
  const handleLoadMoreCards = async (numberOfLoads: number) => {
    setHasMore(false);

    loadCount.current = numberOfLoads;

    const fetchedPosts = await getNewPostsFromRepository();

    const windowHeightPx = getWindowHeight();

    const newPosts = posts.map((col) =>
      col.map<IPost>((rest) => ({ ...rest }))
    );

    let maxHeightPx = numberOfLoads * Constant.EXTENSION_HEIGHT_PX;

    const rem = getColRemainingHeights(posts);

    if (maxHeightPx < windowHeightPx) {
      maxHeightPx = windowHeightPx;
    }

    for (const fetchedPost of fetchedPosts) {
      const remainingHeights = getColRemainingHeights(newPosts);

      const isSkippedToStickPost =
        Math.max(...remainingHeights) < fetchedPost.height;

      // Find the index of the maximum value
      const selectedColIndex = remainingHeights.indexOf(
        Math.max(...remainingHeights)
      );

      // For current column in `posts`
      const colNewPosts = newPosts[selectedColIndex];

      colNewPosts.push(fetchedPost);

      if (isSkippedToStickPost) {
        break;
      }
    }

    setPosts(newPosts);

    // Remove from fetchedPosts state
    const newPostsKeys = newPosts.flatMap((np) =>
      np.flatMap((npFlat) => npFlat.key)
    );

    const deletablePostsFromBuffer = [...postsRepository.current].filter(
      (post) => !newPostsKeys.includes(post.key)
    );

    postsRepository.current = deletablePostsFromBuffer;

    setHasMore(true);
  };

  /**
   * After the size of the screen is changed, this method will reorder the available posts
   *
   * For example if the screen size is 3 column and user wants to resize it to 4 columns (bigger display),
   * this method will be fired automatically
   */
  const reorderPostsToNewScreen = () => {
    const isInitialized = !!posts[0].length;

    if (!isInitialized) {
      return;
    }

    const numOfColumns: number = screenColumn ?? 1;

    const newPosts: IPost[][] = Array.from({ length: numOfColumns }, () => []);

    const flattedPosts = posts.flatMap((post) => post);

    const flattedPostHeight =
      flattedPosts
        .map((fp) => fp.height + Constant.POST_MARGIN_HEIGHT_PX)
        .reduce((prev, curr) => prev + curr) - Constant.POST_MARGIN_HEIGHT_PX;

    const averageColumnHeight = Math.ceil(flattedPostHeight / numOfColumns);

    let currColHeight = 0;
    let currCol = 0;

    for (const flattedPost of flattedPosts) {
      currColHeight += flattedPost.height;

      const isHeightPassed = currColHeight > averageColumnHeight;

      if (isHeightPassed && currCol < numOfColumns) {
        currColHeight = 0;
        currCol += 1;
      }

      newPosts[currCol].push(flattedPost);
    }

    setPosts(newPosts);

    handleLoadMoreCards(loadCount.current + 1);
  };

  /**
   * The page resize changes is handled here to set a state
   */
  const handleResize = () => {
    setScreenColumn(getScreenColumn());
  };

  /**
   * On initialization, some configs have been done
   */
  useEffect(() => {
    window.addEventListener("resize", handleResize);

    setScreenColumn(getScreenColumn());

    setHasMore(true);
  }, []);

  /**
   * Call the proper method to reorder the posts if the screen size has been changed
   */
  useEffect(() => {
    reorderPostsToNewScreen();
  }, [screenColumn]);

  return (
    // `InfiniteScroll` component is a great component to handle the load more while you're scrolling down

    <InfiniteScroll
      loadMore={handleLoadMoreCards}
      hasMore={hasMore}
      threshold={50}
    >
      <Post data={posts} />
    </InfiniteScroll>
  );
}

export default App;

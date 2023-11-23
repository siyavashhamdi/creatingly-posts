import React from "react";
import { IPost, IPostProps } from "../interfaces";
import "./Post.css";

export const Post: React.FC<IPostProps> = ({ data }: IPostProps) => {
  /**
   * Handles a post if it is viewed, it should be vanished after a while
   */
  const handleHide = (_post: IPost) => {
    /*
      TODO: This section requires completion at a later time. To be honest, due to time constraints,
      I haven't had the chance to finish this part but all other parts are function great
    */
  };

  // Create a simple box with a simple animation
  return (
    <div className="main-container">
      {data.map((col, colIndex) => {
        return (
          <div key={colIndex} className="post-container">
            {col.map((post) => {
              handleHide(post);

              return (
                <div
                  id={post.key}
                  className="post"
                  key={post.key}
                  style={{
                    height: post.height,
                    backgroundColor: post.color,
                  }}
                >
                  {post.text}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export interface IPost {
  key: string;
  text: string;
  color: string;
  height: number;
  hideMs: number;
}

export interface IPostProps {
  data: IPost[][];
}

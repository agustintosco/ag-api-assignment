export class Edge<T> {
  cursor: string;
  node: T;
}

export class PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export class Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

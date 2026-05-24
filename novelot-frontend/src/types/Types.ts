export type Novel = {
  id: number;
  title: string;
  author: string;
  likes: number;
  views: number;
  description: string;
  tags: string[];
};

export function isNovel(obj: any): obj is Novel {
  return (
    typeof obj.id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.author === 'string' &&
    typeof obj.likes === 'number' &&
    typeof obj.views === 'number' &&
    typeof obj.description === 'string' &&
    Array.isArray(obj.tags) && obj.tags.every((tag: unknown) => typeof tag === 'string')
  )
}

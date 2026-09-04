export type Novel = {
    id: number;
    title: string;
    author: string;
    likes: number;
    views: number;
    description: string;
    tags: string[];
};

export function isNovel(obj: unknown): obj is Novel {
    if (typeof obj !== "object" || obj === null) return false;

    const n = obj as Record<string, unknown>;

    return (
        typeof n.id === "number" &&
        typeof n.title === "string" &&
        typeof n.author === "string" &&
        typeof n.likes === "number" &&
        typeof n.views === "number" &&
        typeof n.description === "string" &&
        Array.isArray(n.tags) &&
        n.tags.every((tag: unknown) => typeof tag === "string")
    );
}

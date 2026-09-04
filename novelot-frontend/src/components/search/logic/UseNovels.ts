import { useCallback, useEffect, useRef, useState } from "react";
import { isNovel, type Novel } from "@novelot-types/Novel";
import { api } from "@api/novelClients";

function useNovels(
    search: string,
    currentPage: number,
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
    limit: number
) {
    const [novelList, setNovelList] = useState<Novel[]>([]);
    const prevSearchRef = useRef(search);

    const loadNovels = useCallback(
        async (path: string, params: Record<string, string | number>) => {
            const res = await api.get<unknown>(path, { params });

            if (Array.isArray(res.data)) {
                setNovelList(res.data.filter(isNovel));
            } else {
                setNovelList([]);
            }

            return res;
        },
        []
    );

    useEffect(() => {
        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const searchChanged = prevSearchRef.current !== search;
        prevSearchRef.current = search;

        const runFetch = async (path: string, params: Record<string, string | number>) => {
            try {
                await loadNovels(path, params);
            } catch (error: unknown) {
                if (cancelled) return;

                const err = error as { response?: { status?: number; data?: { message?: string } } };
                if (err.response?.status === 400 && err.response.data?.message === "Invalid Page") {
                    setCurrentPage((prev) => prev - 1);
                } else {
                    console.error("Failed to load novels", error);
                }

                if (!cancelled) {
                    setNovelList([]);
                }
            }
        };

        if (search === "") {
            runFetch("/all", { page: currentPage, limit });
        } else if (!searchChanged) {
            runFetch("/search/", { search, page: currentPage, limit });
        } else {
            timeoutId = setTimeout(() => {
                runFetch("/search/", { search, page: currentPage, limit });
            }, 1000);
        }

        return () => {
            cancelled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [search, currentPage, limit, loadNovels, setCurrentPage]);

    return novelList;
}

export default useNovels;

import { useCallback, useEffect, useRef, useState } from "react";
import { isNovel, type Novel } from "@novelot-types/Novel";
import { api } from "@api/novelClients"


function useNovels(search: string, currentPage: number, setCurrentPage: React.Dispatch<React.SetStateAction<number>>, limit: number) {
    const [novelList, setNovelList] = useState<Novel[]>([])
    const prevSearchRef = useRef(search)

    const loadNovels = useCallback((path: string, params: Record<string, string | number>) => {
        api.get<unknown>(path, { params }).then(res => {
            if (Array.isArray(res.data)) {
                setNovelList(res.data.filter(isNovel))
            }
            else {
                setNovelList([])
            }
        })
            .catch(error => {
                if (error.response.status === 400 && error.response.data.message === "Invalid Page") {
                    setCurrentPage(prev => prev - 1)
                }

                console.error("Failed to load novels", error)
                setNovelList([])
            })
    }, [])

    useEffect(() => {
        const searchChanged = prevSearchRef.current !== search
        prevSearchRef.current = search

        if (search === "") {
            loadNovels("/all", { page: currentPage, limit })
            return
        }

        if (!searchChanged) {
            loadNovels("/search/", { search, page: currentPage, limit })
            return
        }

        const timeout = setTimeout(() => {
            loadNovels("/search/", { search, page: currentPage, limit })
        }, 1000)

        return () => clearTimeout(timeout)
    }, [search, currentPage, limit, loadNovels])

    return novelList
}

export default useNovels

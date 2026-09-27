import { useCallback, useEffect, useRef, useState } from "react";
import { isNovel, type Novel } from "@novelot-types/Novel";
import { api } from "@api/novelClients"


function useNovels(search: string, currentPage: number, setCurrentPage: React.Dispatch<React.SetStateAction<number>>, limit: number) {
    const [novelList, setNovelList] = useState<Novel[]>([])
    const prevSearchRef = useRef(search)
    const requestIdRef = useRef(0)

    const loadNovels = useCallback((path: string, params: Record<string, string | number>, requestId: number) => {
        api.get<unknown>(path, { params }).then(res => {
            if (requestId !== requestIdRef.current) return
            if (Array.isArray(res.data)) {
                setNovelList(res.data.filter(isNovel))
            }
            else {
                setNovelList([])
            }
        })
            .catch(error => {
                if (requestId !== requestIdRef.current) return
                if (error.response?.status === 400 && error.response?.data?.message === "Invalid Page") {
                    setCurrentPage(prev => prev - 1)
                }

                console.error("Failed to load novels", error)
                setNovelList([])
            })
    }, [setCurrentPage])

    useEffect(() => {
        const requestId = ++requestIdRef.current
        const searchChanged = prevSearchRef.current !== search
        prevSearchRef.current = search
        let timeout: ReturnType<typeof setTimeout> | undefined

        if (search === "") {
            loadNovels("/all", { page: currentPage, limit }, requestId)
        }
        else if (!searchChanged) {
            loadNovels("/search/", { search, page: currentPage, limit }, requestId)
        }
        else {
            timeout = setTimeout(() => {
                loadNovels("/search/", { search, page: currentPage, limit }, requestId)
            }, 1000)
        }

        return () => {
            requestIdRef.current = requestId + 1
            clearTimeout(timeout)
        }
    }, [search, currentPage, limit, loadNovels])

    return novelList
}

export default useNovels

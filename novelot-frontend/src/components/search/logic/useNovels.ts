import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { isNovel, type Novel } from "../../../types/Types";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:1714"}/api/novels`
})

function useNovels(search: string, currentPage: number, limit: number) {
    const [novelList, setNovelList] = useState<Novel[]>([])
    const prevSearchRef = useRef(search)

    const loadNovels = useCallback((path: string, params: Record<string, string | number>) => {
        api.get<unknown>(path, { params }).then(res => {
            if (Array.isArray(res.data)) {
                setNovelList(res.data.filter(isNovel))
            }
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

import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { load } from "cheerio";
import JSZip from "jszip";
import type { Chapter } from "@apptypes/Chapter.ts";
import type { Novel } from "@apptypes/Novel.ts";

type TocEntry = {
  title: string;
  file: string;
  anchor?: string;
};

async function readText(zip: JSZip, filePath: string): Promise<string> {
  const file = zip.file(filePath);

  if (!file) {
    throw new Error(`Missing ${filePath}`);
  }

  return file.async("string");
}

function resolveHref(fromFile: string, href: string): string {
  return path.posix.join(
    path.posix.dirname(fromFile),
    decodeURIComponent(href),
  );
}

async function parseEpub(
  data: Uint8Array,
  novelId: number,
): Promise<{ novel: Novel; chapters: Chapter[] }> {
  const zip = await JSZip.loadAsync(data);

  const $container = load(await readText(zip, "META-INF/container.xml"), {
    xml: true,
  });
  const opfPath = $container("rootfile").attr("full-path");

  if (!opfPath) {
    throw new Error("container.xml has no rootfile");
  }

  const $opf = load(await readText(zip, opfPath), { xml: true });

  const novel: Novel = {
    id: novelId,
    title: $opf("dc\\:title").first().text().trim(),
    author: $opf("dc\\:creator").first().text().trim(),
    likes: 0,
    views: 0,
    description: "",
    tags: $opf("dc\\:subject")
      .map((_, el) => $opf(el).text().trim())
      .get(),
    totalChapters: 0,
  };

  const manifest = new Map<string, string>();
  $opf("manifest > item").each((_, el) => {
    manifest.set(
      $opf(el).attr("id") ?? "",
      resolveHref(opfPath, $opf(el).attr("href") ?? ""),
    );
  });

  const spine: string[] = [];
  $opf("spine > itemref").each((_, el) => {
    const file = manifest.get($opf(el).attr("idref") ?? "");
    if (file) {
      spine.push(file);
    }
  });

  const ncxHref = $opf(
    'manifest > item[media-type="application/x-dtbncx+xml"]',
  ).attr("href");

  if (!ncxHref) {
    throw new Error("No toc.ncx in manifest");
  }

  const ncxPath = resolveHref(opfPath, ncxHref);
  const $ncx = load(await readText(zip, ncxPath), { xml: true });

  const toc: TocEntry[] = $ncx("navPoint")
    .map((_, el) => {
      const [file, anchor] = (
        $ncx(el).children("content").attr("src") ?? ""
      ).split("#");
      return {
        title: $ncx(el).children("navLabel").text().trim(),
        file: resolveHref(ncxPath, file),
        anchor,
      };
    })
    .get();

  const chapterStarts = new Map<string, number>();
  toc.forEach((entry, index) => {
    const key = entry.anchor ? `${entry.file}#${entry.anchor}` : entry.file;
    if (!chapterStarts.has(key)) {
      chapterStarts.set(key, index);
    }
  });

  const chapters: Chapter[] = toc.map((entry, index) => ({
    novelId,
    chapterNumber: index + 1,
    title: entry.title,
    content: [],
  }));

  let current: number | undefined;

  for (const file of spine) {
    const $doc = load(await readText(zip, file));
    current = chapterStarts.get(file) ?? current;

    $doc("body *").each((_, el) => {
      const id = $doc(el).attr("id");
      if (id) {
        current = chapterStarts.get(`${file}#${id}`) ?? current;
      }

      if (current !== undefined && el.tagName === "p") {
        const text = $doc(el).text().replace(/\s+/g, " ").trim();
        if (text) {
          chapters[current].content.push(text);
        }
      }
    });
  }

  const readableChapters = chapters
    .filter((chapter) => chapter.content.length > 0)
    .map((chapter, index) => ({ ...chapter, chapterNumber: index + 1 }));

  return {
    novel: { ...novel, totalChapters: readableChapters.length },
    chapters: readableChapters,
  };
}

const booksDir = process.argv[2] ?? "../books";
const outDir = process.argv[3] ?? "src/assets";

const files = (await readdir(booksDir))
  .filter((file) => file.endsWith(".epub"))
  .sort();

const novels: Novel[] = [];
const chapters: Chapter[] = [];

for (const [index, file] of files.entries()) {
  const parsed = await parseEpub(
    await readFile(path.join(booksDir, file)),
    index + 1,
  );

  novels.push(parsed.novel);
  chapters.push(...parsed.chapters);

  console.log(
    `${parsed.novel.id}: ${parsed.novel.title} (${parsed.chapters.length} chapters) <- ${file}`,
  );
}

await writeFile(
  path.join(outDir, "novelList.json"),
  JSON.stringify(novels, null, 2),
);
await writeFile(
  path.join(outDir, "chapterList.json"),
  JSON.stringify(chapters, null, 2),
);

console.log(
  `Wrote ${novels.length} novels and ${chapters.length} chapters to ${outDir}`,
);

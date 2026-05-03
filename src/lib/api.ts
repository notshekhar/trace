import axios, { AxiosError } from "axios";

// Axios client for oboe-backend trace API under `/internal/v1/trace/*`
// (Basic Auth — server-only env, never NEXT_PUBLIC_*).
// Caching lives in oboe-backend (in-memory CacheableMemory). Trace pages are
// rendered dynamically and just hit the backend each time.

export interface Article {
    id: string;
    title: string;
    summary: string | null;
    summaryAi: string | null;
    keyTakeaways: string[];
    url: string;
    imageUrl: string | null;
    source: string;
    category: string;
    editionDate: string;
    scrapedAt: string;
    isFeatured: boolean;
}

export interface HotLink {
    id: string;
    source: string;
    title: string;
    url: string;
    externalId: string | null;
    score: number | null;
    comments: number | null;
    byline: string | null;
    editionDate: string;
}

export interface EditionPayload {
    date: string;
    isToday: boolean;
    articles: Article[];
    trending: Article[];
    hotLinks: HotLink[];
    neighbors: { prev: string | null; next: string | null };
}

export interface ArticlePayload {
    article: Article;
    /** Up to 10 other stories from the same edition (API capped). */
    rest: Article[];
    trending: Article[];
    hotLinks: HotLink[];
}

export interface EditionSummary {
    date: string;
    articleCount: number;
    leadTitle: string | null;
}

const BASE = (
    process.env.TRACE_API_BASE ??
    process.env.NEXT_PUBLIC_TRACE_API_BASE ??
    "http://localhost:3000"
).replace(/\/+$/, "");

const internalUser = process.env.INTERNAL_BASIC_AUTH_USER ?? "trace";
const internalPass = process.env.INTERNAL_BASIC_AUTH_PASSWORD ?? "";

const traceClient = axios.create({
    baseURL: `${BASE}/internal/v1/trace`,
    timeout: 20_000,
    headers: { Accept: "application/json" },
    ...(internalPass
        ? { auth: { username: internalUser, password: internalPass } }
        : {}),
});

function emptyEdition(date: string, isToday: boolean): EditionPayload {
    return {
        date,
        isToday,
        articles: [],
        trending: [],
        hotLinks: [],
        neighbors: { prev: null, next: null },
    };
}

function isConnectionError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false;
    const err = error as AxiosError;
    if (err.response) return false;
    const code = err.code;
    return (
        code === "ECONNREFUSED" ||
        code === "ENOTFOUND" ||
        code === "ETIMEDOUT" ||
        code === "ECONNRESET" ||
        code === "EAI_AGAIN"
    );
}

class NotFoundError extends Error {
    readonly _trace_not_found = true;
}

// ---- Raw fetchers ---------------------------------------------------------

async function fetchEdition(path: string): Promise<EditionPayload> {
    try {
        const { data } = await traceClient.get<{ message: string; data: EditionPayload }>(
            path,
        );
        return data.data;
    } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
            throw new NotFoundError(`edition not found: ${path}`);
        }
        throw e;
    }
}

async function fetchArticle(id: string): Promise<ArticlePayload> {
    try {
        const { data } = await traceClient.get<{ message: string; data: ArticlePayload }>(
            `/articles/${encodeURIComponent(id)}`,
        );
        return data.data;
    } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
            throw new NotFoundError(`article not found: ${id}`);
        }
        throw e;
    }
}

async function fetchArchive(): Promise<EditionSummary[]> {
    const { data } = await traceClient.get<{
        message: string;
        data: { editions: EditionSummary[] };
    }>("/archive");
    return data.data.editions ?? [];
}

// ---- Safe wrappers --------------------------------------------------------
// Caching is handled by oboe-backend; we only translate errors here and fall
// back gracefully on connection failures.

function isNotFound(e: unknown): e is NotFoundError {
    return e instanceof Error && (e as { _trace_not_found?: true })._trace_not_found === true;
}

function logConn(where: string, e: unknown) {
    const msg = axios.isAxiosError(e) ? e.message : String(e);
    console.warn(`[trace-api] cannot reach ${BASE} (${where}): ${msg}`);
}

export function getTodayEditionDate(): string {
    return new Date().toISOString().split("T")[0]!;
}

export async function getToday(): Promise<EditionPayload | null> {
    const date = getTodayEditionDate();
    try {
        return await fetchEdition("/today");
    } catch (e) {
        if (isNotFound(e)) return emptyEdition(date, true);
        if (isConnectionError(e)) {
            logConn("/today", e);
            return emptyEdition(date, true);
        }
        throw e;
    }
}

export async function getEdition(date: string): Promise<EditionPayload | null> {
    const today = getTodayEditionDate();
    try {
        return await fetchEdition(`/editions/${encodeURIComponent(date)}`);
    } catch (e) {
        if (isNotFound(e)) return null;
        if (isConnectionError(e)) {
            logConn(`/editions/${date}`, e);
            return emptyEdition(date, date === today);
        }
        throw e;
    }
}

export async function getArticle(id: string): Promise<ArticlePayload | null> {
    try {
        return await fetchArticle(id);
    } catch (e) {
        if (isNotFound(e)) return null;
        if (isConnectionError(e)) {
            logConn(`/articles/${id}`, e);
            return null;
        }
        throw e;
    }
}

export async function getArchive(): Promise<EditionSummary[]> {
    try {
        return await fetchArchive();
    } catch (e) {
        if (isConnectionError(e)) {
            logConn("/archive", e);
            return [];
        }
        throw e;
    }
}

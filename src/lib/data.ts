
import * as cheerio from 'cheerio';

export interface TrendItem {
    id: string;
    rank: number;
    keyword: string;
    hotScore: number;
    change: number;
    category?: string;
    description?: string;
    url?: string;
    displayMetric?: string;
    hideScore?: boolean;
}

export interface SectorData {
    id: string;
    name: string;
    icon: string;
    accentColor: string;
    sectorUrl?: string;
    trends: TrendItem[];
}

// --- STATIC REAL SNAPSHOTS (Last resort) ---
const DOUYIN_SNAPSHOTS = [
    "小米SU7发布会", "尔滨宠粉", "繁花大结局", "科目三舞蹈",
    "董宇辉新号", "这泼天的富贵", "秦朗丢寒假作业", "甘肃天水麻辣烫",
    "王婆说媒", "凯特王妃去哪了"
];

// Fallback generator
const generateFallback = (names: string[], baseScore: number, metricType?: 'douyin' | 'app' | 'viral'): TrendItem[] => {
    return names.map((name, i) => {
        const isApp = metricType === 'app';
        const isViral = metricType === 'viral';

        let url = `https://www.douyin.com/search/${encodeURIComponent(name)}`;
        if (isApp) url = 'https://apps.apple.com/cn/app';
        if (isViral) url = `https://www.google.com/search?q=${encodeURIComponent(name)}`;

        return {
            id: `fallback-${i}`,
            rank: i + 1,
            keyword: name,
            hotScore: baseScore - (i * 50000),
            change: 0,
            category: "Trending",
            description: "Hot Topic",
            url,
            hideScore: isApp
        };
    });
};

// --- HELPER FOR REAL PRICES ---
async function fetchAppDetails(ids: string[], country: string): Promise<Record<string, string>> {
    if (ids.length === 0) return {};
    try {
        const res = await fetch(`https://itunes.apple.com/lookup?id=${ids.join(',')}&country=${country}`, { next: { revalidate: 86400 } });
        if (!res.ok) return {};
        const data = await res.json();
        const priceMap: Record<string, string> = {};
        data.results.forEach((item: any) => {
            priceMap[item.trackId.toString()] = item.formattedPrice || '';
        });
        return priceMap;
    } catch (e) {
        return {};
    }
}

// --- REAL DATA FETCHERS ---

// 1. iOS App Store (CN) - Free Apps
async function fetchIOSCNApps(): Promise<TrendItem[]> {
    try {
        const res = await fetch('https://rss.applemarketingtools.com/api/v2/cn/apps/top-free/20/apps.json', { next: { revalidate: 86400 } });
        if (!res.ok) throw new Error('Failed to fetch iOS apps');
        const data = await res.json();
        return data.feed.results.map((app: any, index: number) => ({
            id: `cn-free-${app.id}`,
            rank: index + 1,
            keyword: app.name,
            hotScore: 100 - index,
            change: 0,
            category: app.genres[0]?.name,
            description: app.artistName,
            url: app.url,
            hideScore: true
        })).slice(0, 10);
    } catch (e) {
        return [];
    }
}

// 2. iOS App Store (CN) - Paid Apps
async function fetchIOSCNPaidApps(): Promise<TrendItem[]> {
    try {
        const res = await fetch('https://rss.applemarketingtools.com/api/v2/cn/apps/top-paid/20/apps.json', { next: { revalidate: 86400 } });
        if (!res.ok) throw new Error('Failed to fetch iOS paid apps');
        const data = await res.json();

        // Extract IDs for price lookup
        const apps = data.feed.results.slice(0, 10);
        const ids = apps.map((app: any) => app.id);
        const prices = await fetchAppDetails(ids, 'cn');

        return apps.map((app: any, index: number) => ({
            id: `cn-paid-${app.id}`,
            rank: index + 1,
            keyword: app.name,
            hotScore: 100 - index,
            change: 0,
            category: "¥" + (index + 1),
            description: app.artistName,
            url: app.url,
            displayMetric: prices[app.id] || 'Paid',
            hideScore: false
        }));
    } catch (e) {
        return [];
    }
}

// 3. iOS App Store (US) - Free Apps
async function fetchIOSUSApps(): Promise<TrendItem[]> {
    try {
        const res = await fetch('https://rss.applemarketingtools.com/api/v2/us/apps/top-free/20/apps.json', { next: { revalidate: 86400 } });
        if (!res.ok) throw new Error('Failed to fetch iOS US apps');
        const data = await res.json();
        return data.feed.results.map((app: any, index: number) => ({
            id: `us-free-${app.id}`,
            rank: index + 1,
            keyword: app.name,
            hotScore: 100 - index,
            change: 0,
            category: app.genres[0]?.name,
            description: app.artistName,
            url: app.url,
            hideScore: true
        })).slice(0, 10);
    } catch (e) {
        return [];
    }
}

// 4. iOS App Store (US) - Paid Apps
async function fetchIOSUSPaidApps(): Promise<TrendItem[]> {
    try {
        const res = await fetch('https://rss.applemarketingtools.com/api/v2/us/apps/top-paid/20/apps.json', { next: { revalidate: 86400 } });
        if (!res.ok) throw new Error('Failed to fetch iOS US paid apps');
        const data = await res.json();

        // Extract IDs for price lookup
        const apps = data.feed.results.slice(0, 10);
        const ids = apps.map((app: any) => app.id);
        const prices = await fetchAppDetails(ids, 'us');

        return apps.map((app: any, index: number) => ({
            id: `us-paid-${app.id}`,
            rank: index + 1,
            keyword: app.name,
            hotScore: 100 - index,
            change: 0,
            category: "$" + (index + 1),
            description: app.artistName,
            url: app.url,
            displayMetric: prices[app.id] || 'Paid',
            hideScore: false
        }));
    } catch (e) {
        return [];
    }
}

// 5. Douyin (Live)
async function fetchDouyinTrends(): Promise<TrendItem[]> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch('https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/', {
            cache: 'no-store', // LIVE
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
            const json = await res.json();
            if (json.word_list) {
                return json.word_list.map((item: any, index: number) => ({
                    id: `douyin-${index}`,
                    rank: index + 1,
                    keyword: item.word,
                    hotScore: item.hot_value,
                    change: 0,
                    category: "Douyin",
                    url: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`
                })).slice(0, 10);
            }
        }
    } catch (e) {
        // console.warn("Douyin fetch failed");
    }

    return generateFallback(DOUYIN_SNAPSHOTS, 8000000);
}

// 6. Google Trends RSS (Live)
async function fetchViralTrends(): Promise<TrendItem[]> {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    try {
        const res = await fetch('https://trends.google.com/trending/rss?geo=US', { cache: 'no-store', headers });
        if (res.ok) {
            const xml = await res.text();
            const $ = cheerio.load(xml, { xmlMode: true });
            const items: TrendItem[] = [];

            $('item').each((i, el) => {
                if (i >= 10) return;
                const title = $(el).find('title').text();
                const traffic = $(el).find('ht\\:approx_traffic').text();

                // FORCE GENERATE SEARCH URL to avoid parsing errors
                const link = `https://www.google.com/search?q=${encodeURIComponent(title)}`;

                items.push({
                    id: `google-${i}`,
                    rank: i + 1,
                    keyword: title,
                    hotScore: 100 - i,
                    change: 0,
                    category: "Trends",
                    url: link,
                    displayMetric: traffic ? `🔥 ${traffic}` : "🔥 Hot",
                    hideScore: false
                });
            });
            if (items.length > 0) return items;
        }
    } catch (e) { }

    return [{
        id: 'error',
        rank: 0,
        keyword: "Connection Unavailable",
        hotScore: 0,
        change: 0,
        category: "Network Error",
        url: "#",
        hideScore: true
    }];
}

export const getDailyTrends = async (): Promise<SectorData[]> => {
    const [douyinTrends, viralTrends, cnFree, cnPaid, usFree, usPaid] = await Promise.all([
        fetchDouyinTrends(),
        fetchViralTrends(),
        fetchIOSCNApps(),
        fetchIOSCNPaidApps(),
        fetchIOSUSApps(),
        fetchIOSUSPaidApps(),
    ]);

    return [
        {
            id: "douyin",
            name: "抖音爆款",
            icon: "🎵",
            accentColor: "#000000",
            sectorUrl: "https://www.douyin.com/hot",
            trends: douyinTrends,
        },
        {
            id: "viral",
            name: "Google Trends (US)",
            icon: "📈",
            accentColor: "#4285F4",
            sectorUrl: "https://trends.google.com/trending?geo=US",
            trends: viralTrends,
        },
        {
            id: "cn-free",
            name: "🇨🇳 iOS 免费榜",
            icon: "🍎",
            accentColor: "#e63946",
            sectorUrl: "https://apps.apple.com/cn/charts/iphone/top-free-apps/36",
            trends: cnFree,
        },
        {
            id: "cn-paid",
            name: "🇨🇳 iOS 付费榜",
            icon: "🧧",
            accentColor: "#ffbd00",
            sectorUrl: "https://apps.apple.com/cn/charts/iphone/top-paid-apps/36",
            trends: cnPaid,
        },
        {
            id: "us-free",
            name: "🇺🇸 iOS 免费榜",
            icon: "🦅",
            accentColor: "#457b9d",
            sectorUrl: "https://apps.apple.com/us/charts/iphone/top-free-apps/36",
            trends: usFree,
        },
        {
            id: "us-paid",
            name: "🇺🇸 iOS 付费榜",
            icon: "💵",
            accentColor: "#f1faee",
            sectorUrl: "https://apps.apple.com/us/charts/iphone/top-paid-apps/36",
            trends: usPaid,
        },
    ];
};

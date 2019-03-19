const fetchPageData = async (page, query, url) => {
    try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
    }
    catch (err) {
        return [];
    }

    return page.evaluate((originalUrl, query) => {
        if (window.location.href === originalUrl) {
            const data = $("body").data(window.location.href);
            if (data && Array.isArray(data.result)) {
                return data.result.map(result => {
                    return {
                        query,
                        title: result.title,
                        referring_page: result.url_from,
                        domain_rating: result.DomainRating,
                        url_rating: result.ahrefs_rank,
                        refdomains: result.refdomains,
                        anchor: result.anchor,
                        first_seen: result.first_seen,
                        last_check: result.last_visited,
                        similar_backlinks: result.TotalBacklinks
                    };
                });
            }
        }
        return [];
    }, url, query);
};

const fetchQueryData = (page, query, maxPages = 1) => {
    return new Promise(async resolve => {
        let pageData = [];
        query = new URL(query);
        query = query.host + query.pathname;

        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            let url = `https://ahrefs.com/site-explorer/backlinks/v7/external-similar-links/exact/live/all/all/dofollow/${pageNum}/domain_rank_desc?target=${encodeURIComponent(query)}`;

            console.time("- Page time");
            console.log(`\n- Fetching page #${pageNum}...`);

            let newData = await fetchPageData(page, query, url);

            console.log(`- Fetched ${newData.length} items`);
            console.timeEnd("- Page time");

            if (!newData.length) break;
            pageData.push(...newData);
        }
        resolve(pageData);
    });
};

module.exports = { fetchQueryData };

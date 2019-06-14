const fetchPageData = async (page, query, url) => {
    try {
        await page.goto(url, { waitUntil: "domcontentloaded" });

        let response = await page.waitForResponse("https://ahrefs.com/v3/api-adaptor/ceSearchResults");
        if (response.ok()) {
            response = await response.json();

            let results = response[1].results.map(result => ({
                query,
                title: result.title,
                url: result.url,
                domain_rating: result.domainRating,
                refdomains: result.refDomains[1],
                traffic: Math.round(result.traffic[1])
            }));
            return results;
        }
        return [];
    }
    catch (err) {
        return [];
    }
};

const fetchQueryData = (page, query, maxPages = 1) => {
    return new Promise(async resolve => {
        let pageData = [];
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            let today = new Date().toISOString().substr(0, 10);
            let lastYear = new Date(Number(today.substr(0, 4)) - 1 + today.substr(4)).toISOString().substr(0, 10);
            let url = `https://ahrefs.com/content-explorer/results/en/score_desc?topic=${encodeURIComponent(query)}&filter-broken-pages=all&publish_type=all&published=${encodeURIComponent(lastYear + "T00:00:00+05:30")},${encodeURIComponent(today + "T23:59:59+05:30")}&filter-refdomains=25-&chart-range=last_30_days&page=${pageNum}&results-per-page=100`;

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

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
                        url: result.url,
                        domain_rating: result.domain_rating,
                        refdomains: result.refdomains,
                        traffic: result.traffic
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
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            let url = `https://ahrefs.com/content-explorer/overview/v4/all/${pageNum}/score_desc?topic=${encodeURIComponent(query)}&dateRange=2018-12-01,2019-02-28&filter-refdomains=25-0`;

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

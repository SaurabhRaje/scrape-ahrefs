const puppeteer = require("puppeteer");

const Utils = require("./js/utils");
const ContentExplorer = require("./js/content_explorer");
const SiteExplorer = require("./js/site_explorer");

const args = Utils.parseArgs(process.argv.slice(2));

const fetchSectionData = (page, section, queries) => {
    return new Promise(async (resolve, reject) => {
        let crawler;
        switch (section) {
            case "content_explorer":
                crawler = ContentExplorer;
                break;
            case "site_explorer":
                crawler = SiteExplorer;
                break;
            default:
                reject("Unsupported section requested");
                return;
        }

        let fetchTotal = 0;
        const collatedData = [];
        const path = Utils.getPath(section);

        for (let i = 0, len = queries.length; i < len; i++) {
            let query = queries[i];

            console.log(`\n[${i + 1} of ${len}]\nQuerying for "${query}"...`);
            console.time("Query time");

            let queryData = await crawler.fetchQueryData(page, query, args.max_pages);
            console.log(`\nGot ${queryData.length} items for "${query}"`);
            fetchTotal += queryData.length;

            if (args.collate === "y") {
                collatedData.push(...queryData);
            }
            else {
                let filename = `${path}/${query.toLowerCase().replace(/\s/g, "_").replace(/\W+/g, "-").replace(/-$/, "")}.csv`;
                let writeResult = await Utils.writeOutputFile(queryData, path, filename);
                console.log(writeResult);
            }

            console.timeEnd("Query time");
        }

        if (args.collate === "y") {
            let filename = `${path}/${path.substr(path.lastIndexOf("/") + 1)}.csv`;
            let writeResult = await Utils.writeOutputFile(collatedData, path, filename);
            console.log(`\n${writeResult}`);
        }

        resolve(fetchTotal);
    });
};

const closeBrowser = async browser => {
    await browser.close();
    console.log("Browser closed\n");
};

(async () => {
    console.time(" TOTAL OPERATION TIME");

    let section = "";
    switch (args.section) {
        case "ce":
            section = "content_explorer";
            break;
        case "se":
            section = "site_explorer";
            break;
        default:
            console.error("Unsupported section requested");
            return;
    }

    if (!args.username || !args.password) {
        console.error("Username or password not provided");
        return;
    }

    const queries = await Utils.readInputFile(`src/csv/${section}/queries.csv`);
    if (Array.isArray(queries) && queries.length) {
        const browser = await puppeteer.launch({
            headless: args.headless === "y",
            devtools: args.devtools === "y"
        });

        const page = (await browser.pages())[0];
        page.setViewport({ width: 1366, height: 768 });
        console.log("\nBrowser opened");

        console.log("Logging in...");
        try {
            await Utils.login(page, args.username, args.password);
        }
        catch (err) {
            console.error("Login failed. Please check the username and password.");
            closeBrowser(browser);
            return;
        }
        console.log("Login complete");

        if (section === "site_explorer") {
            await Utils.setItemCount(page);
            console.log("Items per page set to 100");
        }

        const fetchResult = await fetchSectionData(page, section, queries);
        console.log("\nOperation complete");

        closeBrowser(browser);

        console.log("-".repeat(35));
        console.log(` TOTAL ITEMS: ${fetchResult}`);
        console.timeEnd(" TOTAL OPERATION TIME");
        console.log("-".repeat(35));
    }
})();

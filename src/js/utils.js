const fs = require("fs");
const converter = require("json-2-csv");

const parseArgs = args => {
    const parsedArgs = {};
    args.forEach(arg => {
        let match = arg.match(/^--(\w+)=(\S+)$/);
        if (match && match.length === 3) {
            parsedArgs[match[1]] = match[2];
        }
    });
    console.log("Options:");
    console.table(parsedArgs);
    return parsedArgs;
};

const getPath = section => {
    const timezoneOffset = new Date().getTimezoneOffset() * 60000;
    const timestamp = new Date(Date.now() - timezoneOffset).toISOString();
    const dirName = timestamp.substr(0, timestamp.indexOf(".")).replace(/\D/g, "-");
    return `dist/csv/${section}/${dirName}`;
};

const readInputFile = filename => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, "utf8", (err, csv) => {
            if (err) return reject(err.message);
            console.log(`\n"${filename}" read`);

            csv = csv.replace(/\r\n/g, "\n");
            converter.csv2jsonAsync(csv, { excelBOM: true }).then(json => {
                json = json.map(item => item.query);
                resolve(json);
            });
        });
    });
};

const writeOutputFile = (json, path, filename) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, { recursive: true }, async err => {
            if (err) return reject(err.message);

            const csv = await converter.json2csvAsync(json, { excelBOM: true });
            fs.writeFile(filename, csv, err => {
                if (err) return reject(err.message);
                resolve(`"${filename}" written`);
            });
        });
    });
};

const login = async (page, username, password) => {
    await page.goto("https://ahrefs.com/user/login");
    page.evaluate((username, password) => {
        $("#formLogin input[name='email']").val(username);
        $("#formLogin input[name='password']").val(password);
        $("#formLogin input[name='remember_me']").click();
        $("#formLogin input[type='submit']").click();
    }, username, password);
    return page.waitForNavigation({ waitUntil: "domcontentloaded" });
};

const setItemCount = async page => {
    await page.goto("https://ahrefs.com/site-explorer");
    page.evaluate(() => {
        SetItemsPerPage(100, window.location.href, "se");
    });
    return page.waitForResponse("https://ahrefs.com/site-explorer/ajax/set/items-per-page/se");
};

module.exports = {
    parseArgs,
    getPath,
    readInputFile,
    writeOutputFile,
    login,
    setItemCount
};

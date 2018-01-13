const puppeteer = require("puppeteer");

const TIMEOUT = 10000;
const HEADLESS = true;
const DEBUG = process.env.DEBUG === "true";

const getTextContent = async elementHandle => {
  const jsHandle = await elementHandle.getProperty("textContent");
  return jsHandle.jsonValue();
};

const parseRow = async row => {
  const [accountHandle, transactionHandle, amountHandle] = await row.$$("td");
  const account = await getTextContent(accountHandle);
  const transaction = await getTextContent(transactionHandle);
  const amount = await getTextContent(amountHandle);
  return {
    account,
    transaction,
    amount: Number(amount.slice(0, -1)),
    currency: "€"
  };
};

const extractFromFrame = async frame => {
  const rows = await frame.$$("tr:not(:first-child)");
  return Promise.all(rows.map(parseRow));
};

const extractFromMain = async page => {
  await page.waitForSelector("table", { timeout: TIMEOUT });
  return extractFromFrame(page);
};

(async () => {
  const browser = await puppeteer.launch({ headless: HEADLESS });
  const page = await browser.newPage();

  let skip = 0;
  let transactions = [];
  let loadMore = true;
  let stopMainWait = null;

  page.on("dialog", async dialog => {
    await dialog.dismiss();
    // Must wait for the eventListener to be registered
    // TODO: Find a better solution
    await page.waitFor(500);
    await page.click("#btnGenerate");
  });

  page.on("frameattached", async frame => {
    const transactionsValues = await extractFromFrame(frame);
    if (stopMainWait) return stopMainWait(transactionsValues);
  });

  do {
    const stopMainPromise = new Promise(resolve => {
      stopMainWait = resolve;
    });
    await page.goto(
      "https://web.bankin.com/challenge/index.html?start=" + skip
    );

    if (DEBUG) {
      const result = await page.evaluate(() => {
        return { start, failmode, hasiframe, slowmode };
      });
      console.log("Round vals", result);
    }

    const transactionsValues = await Promise.race([
      extractFromMain(page),
      stopMainPromise
    ]);

    loadMore = transactionsValues.length > 0;
    skip += transactionsValues.length;
    transactions.push(...transactionsValues);
    DEBUG && console.log("Got more results", skip);
  } while (loadMore);

  console.log(transactions);
  await browser.close();
})();

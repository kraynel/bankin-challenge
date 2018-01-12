const puppeteer = require("puppeteer");

const TIMEOUT = 10000;
const HEADLESS = true;

const getTextContent = async elementHandle => {
  const jsHandle = await elementHandle.getProperty("textContent");
  return jsHandle.jsonValue();
};

const parseRow = async row => {
  const [accountHandle, transactionHandle, amountHandle] = await row.$$("td");
  const account = await getTextContent(accountHandle);
  const transaction = await getTextContent(transactionHandle);
  const amount = await getTextContent(amountHandle);
  return { account, transaction, amount };
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
  console.log("START");
  const browser = await puppeteer.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  console.log("NEW PAGE LOADED");

  page.on("dialog", async dialog => {
    await dialog.dismiss();
    await page.click("#btnGenerate");
  });

  let skip = 0;
  let transactions = [];
  let shouldEnd = false;

  do {
    let stopMainWait = null;
    const stopMainPromise = new Promise(resolve => {
      stopMainWait = resolve;
    });

    page.once("frameattached", async frame => {
      const transactionsValues = await extractFromFrame(frame);
      stopMainWait(transactionsValues);
    });

    await page.goto(
      "https://web.bankin.com/challenge/index.html?start=" + skip
    );
    const transactionsValues = await Promise.race([
      extractFromMain(page),
      stopMainPromise
    ]);

    shouldEnd = transactionsValues.length === 0;
    skip += transactionsValues.length;
    transactions.push(...transactionsValues);

    console.log("Got more results", skip);
  } while (!shouldEnd);

  console.log(transactions);
  await browser.close();
})();

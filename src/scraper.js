const getTextContent = async elementHandle => {
  // Extract HTML textContent attribute
  const jsHandle = await elementHandle.getProperty("textContent");
  return jsHandle.jsonValue();
};

const parseRow = async row => {
  // Split by columns
  const [accountHandle, transactionHandle, amountHandle] = await row.$$("td");

  // Fetch text content for each column
  const account = await getTextContent(accountHandle);
  const transaction = await getTextContent(transactionHandle);
  const amount = await getTextContent(amountHandle);

  // Return parsed result
  return {
    account,
    transaction,
    amount: Number(amount.slice(0, -1)),
    currency: "€"
  };
};

const extractFromFrame = async frame => {
  // Wait for a table element to be present
  await frame.waitForSelector("table");
  // Select all rows, ignoring the header one
  const rows = await frame.$$("tr:not(:first-child)");
  // Parse all rows and return the result
  return Promise.all(rows.map(parseRow));
};

const scraper = async (
  browser,
  firstResult = 0,
  lastResult = Number.MAX_SAFE_INTEGER
) => {
  const page = await browser.newPage();

  let skip = firstResult;
  let transactions = [];
  let loadMore = true;
  let stopMainWait = null;

  // Event triggered when the alert modal is displayed
  page.on("dialog", async dialog => {
    // Dismiss the error alert
    await dialog.dismiss();
    // Must wait for the eventListener to be registered
    // TODO: Find a better solution
    await page.waitFor(500);
    // Click on "retry" button
    await page.click("#btnGenerate");
  });

  // Event triggered when an iframe is loaded
  page.on("frameattached", async frame => {
    const transactionsValues = await extractFromFrame(frame);
    if (stopMainWait) return stopMainWait(transactionsValues);
  });

  while (loadMore) {
    const stopMainPromise = new Promise(resolve => {
      stopMainWait = resolve;
    });
    await page.goto(
      "https://web.bankin.com/challenge/index.html?start=" + skip
    );

    const transactionsValues = await Promise.race([
      extractFromFrame(page),
      stopMainPromise
    ]);

    console.log(
      `Transactions ${skip} - ${skip + transactionsValues.length} loaded`
    );
    skip += transactionsValues.length;
    loadMore = transactionsValues.length > 0 && skip < lastResult;
    transactions.push(...transactionsValues);
  }

  return transactions;
};

module.exports = scraper;

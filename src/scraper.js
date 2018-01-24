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
  // Open a new tab
  const page = await browser.newPage();

  // Initialize the loop
  const allTransactions = [];
  let skip = firstResult;
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
    const transactions = await extractFromFrame(frame);
    if (stopMainWait) return stopMainWait(transactions);
  });

  // While there are more transactions to load
  while (loadMore) {
    // Initialize a promise.
    // Will be resolve with transactions from the iframe if they exist
    const stopMainPromise = new Promise(resolve => {
      stopMainWait = resolve;
    });

    // Navigate to the page, with the correct start parameter
    await page.goto(
      `https://web.bankin.com/challenge/index.html?start=${skip}`
    );

    // Race between the apparition of table in the main frame or an iframe
    const transactions = await Promise.race([
      extractFromFrame(page),
      stopMainPromise
    ]);

    console.log(`Transactions ${skip} - ${skip + transactions.length} loaded`);
    // Append transaction to the main array
    allTransactions.push(...transactions);

    // Update variables for next loop
    skip += transactions.length;
    loadMore = transactions.length > 0 && skip < lastResult;
  }

  return allTransactions;
};

module.exports = scraper;

const fs = require("fs");
const puppeteer = require("puppeteer");
const scraper = require("./src/scraper");

const OUTPUT_FILE = "transactions.json";

(async () => {
  // Launch a new instance of Headless Chrome
  const browser = await puppeteer.launch();

  // Fetch transactions then close the browser
  const transactions = await scraper(browser);
  await browser.close();

  // Write transactions to the output file
  fs.writeFile(OUTPUT_FILE, JSON.stringify(transactions), err => {
    if (err) return console.log(err);
    console.log(`${OUTPUT_FILE} saved`);
  });
})();

const fs = require("fs");
const puppeteer = require("puppeteer");
const scraper = require("./src/scraper");

(async () => {
  // Launch a new instance of Headless Chrome
  const browser = await puppeteer.launch();

  // Fetch transactions then close the browser
  const transactions = await scraper(browser);
  await browser.close();

  // Write transactions to the output file
  fs.writeFile("transactions.json", JSON.stringify(transactions), err => {
    if (err) return console.log(err);
    console.log("transactions.json saved");
  });
})();

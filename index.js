const puppeteer = require("puppeteer");
const scraper = require("./src/scraper");

(async () => {
  const browser = await puppeteer.launch();
  const transactions = await scraper(browser);

  console.log(transactions);
  await browser.close();
})();

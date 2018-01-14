const fs = require("fs");
const puppeteer = require("puppeteer");
const scraper = require("./src/scraper");

(async () => {
  const browser = await puppeteer.launch();
  const transactions = await scraper(browser);
  await browser.close();

  fs.writeFile("transactions.json", JSON.stringify(transactions), function(
    err
  ) {
    if (err) {
      return console.log(err);
    }

    console.log("transactions.json saved");
  });
})();

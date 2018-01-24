# Bankin Challenge

## What is it?

This repo is a scraper for the [Bankin' challenge](https://blog.bankin.com/challenge-engineering-web-scrapping-dc5839543117).
It uses Puppeteer to command a headless Chromium.

## How to install and run?

You will need a recent node version installed, 8.9 for instance. See [nvm](https://github.com/creationix/nvm).

```bash
# Install puppeteer
yarn
# Run the scraper
yarn start
# Check the results
cat transactions.json
```

## Asumptions

The challenge was (intentionally?) not very precise. Here are some asumptions I chose to make:

1. I only fetch transactions accessible by a positive `start` offset in the URL.
2. I suppose I do not know the total number of transaction (4999), which could help build a parallel scraper.
3. I will not directly call any JS function defined in `load.js`, like `doGenerate`.
4. I will not set global JS variables, like `slowmode`, `hasiframe`, `failmode`, etc.
5. I chose not to extract the transaction number but to keep the transaction. I would probably have used a regex to do so.
6. The amount of the transaction is always in euro, with the euro sign the last character of that column.
7. The final array is outputed in a file called `transactions.json` rather than in `STDOUT`.

## Improvements

Some improvements that could be done:

1. Test it, with at least one test per case.
2. Parallelize it. That could be done by spawning multiple browers or tabs, then by aggregating the result. The speed improvement should be linear.
3. When `failmode` is active, a button is added on alert dismissal. The `onClick` listener is added using a jQuery call, after the button is added to the DOM. I wait for a fixed amount a time for this listener to be added. Because of asumption #3, I chose not to call that click callback directly.

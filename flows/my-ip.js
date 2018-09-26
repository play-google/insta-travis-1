const puppeteer = require("puppeteer");
const axios = require("axios");

const width = 1200;
const height = 600;

module.exports = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--window-size=${width},${height}`]
  });

  const page = await browser.newPage();

  await page.goto("http://ip-api.com/");

  await page.waitForSelector("#o tr:nth-of-type(1)");

  const text = await page.evaluate(
    () => document.querySelector("#o tr:nth-of-type(1)").textContent
  );
  const text1 = await page.evaluate(
    () => document.querySelector("#o tr:nth-of-type(2)").textContent
  );
  const text2 = await page.evaluate(
    () => document.querySelector("#o tr:nth-of-type(3)").textContent
  );
  const text3 = await page.evaluate(
    () => document.querySelector("#o tr:nth-of-type(4)").textContent
  );

  console.log(text, text1, text2, text3);

  const options = {
    method: "POST",
    headers: { "content-type": "application/json" },
    data: JSON.stringify({ text, text1, text2, text3 }),
    url: process.env.API
  };
  console.log(await axios(options));

  await browser.close();
};

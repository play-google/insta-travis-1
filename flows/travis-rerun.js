const puppeteer = require("puppeteer");

const signInButtonSelector = ".auth-button.signed-out";
const githubLoginSelector = "#login_field";
const githubPasswordSelector = "#password";
const githubSignInBtnSelector = ".btn.btn-primary.btn-block";

const travisRebuildBtnSelector = ".action-button--restart";

const width = 1200;
const height = 600;

module.exports = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=${width},${height}`]
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto("https://travis-ci.org/");
  await page.waitForSelector(signInButtonSelector);
  await page.click(signInButtonSelector);
  await page.waitFor(4000);
  await page.type(githubLoginSelector, process.env.RERUN_LOGIN);
  await page.type(githubPasswordSelector, process.env.RERUN_PASSWORD);
  await page.click(githubSignInBtnSelector);
  await page.waitFor(4000);
  await page.goto(
    `https://travis-ci.org/${process.env.RERUN_LOGIN}/${process.env.RERUN_REPO}`
  );
  await page.waitForSelector(travisRebuildBtnSelector);
  await page.click(travisRebuildBtnSelector);
  await page.waitFor(4000);

  await browser.close();
};

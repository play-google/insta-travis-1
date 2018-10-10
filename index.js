const puppeteer = require("puppeteer");
const instagramSubscribeFlow = require("./flows/instagram-subscribe");
const twitterSubscribeFlow = require("./flows/twitter-subscribe");
const axios = require("axios");

const userServiceReadySelector = "#app-ready";

(async () => {
  const browser = await puppeteer.launch({
    slowMo: 50
  });
  const page = await browser.newPage();

  await page.goto(`${process.env.API}/statistic`);
  await page.waitFor(userServiceReadySelector);

  const user = await axios
    .get(`${process.env.API}/promotion-users/availible`)
    .then(response => response.data);

  if (!user) {
    await browser.close();
    process.exit(0);
  }

  switch (user.socialType) {
    case "TWITTER":
      await twitterSubscribeFlow(user);
      break;
    case "INSTAGRAM":
      await instagramSubscribeFlow(user);
      break;
  }

  await axios.get(`${process.env.API}/promotion-users/${user._id}/used`);

  await browser.close();
  process.exit(0);
})();

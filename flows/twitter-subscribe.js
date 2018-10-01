const puppeteer = require("puppeteer");
const axios = require("axios");

require("dotenv").config();

const twitterLoginPageUrl = "https://twitter.com/login";

const emailInputSelector = ".js-username-field.email-input";
const passwordInputSelector = ".js-password-field";
const loginBtnSelector =
  ".submit.EdgeButton.EdgeButton--primary.EdgeButtom--medium";

async function subscribe(subsCount) {
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  const userCardSelector = ".GridTimeline-items .ProfileCard";
  const userSubscribeContainerSelector = ".user-actions";
  const subscribeBtnSelector = ".follow-text";
  const userNameSelector = ".u-linkComplex-target";
  const followingClass = "following";

  let result = {
    subscribed: [],
    subscribedCount: 0,
    error: null
  };
  try {
    for (let i = 0; i < 35; ++i) {
      window.scrollTo(0, 60000);
      await sleep(100);
    }

    const subscribeTargets = [...document.querySelectorAll(userCardSelector)];

    let subscribersCount = 0;
    let j = 0;

    while (subscribersCount !== subsCount) {
      let subscribeTarget = subscribeTargets[j];
      let userName = subscribeTarget.querySelector(userNameSelector).innerHTML;
      let userSubscribeContainer = subscribeTarget.querySelector(
        userSubscribeContainerSelector
      );
      let subscribeBtn = userSubscribeContainer.querySelector(
        subscribeBtnSelector
      );

      if (!userSubscribeContainer.classList.contains(followingClass)) {
        subscribeBtn.click();
        await sleep(2000);
        if (userSubscribeContainer.classList.contains(followingClass)) {
          result.subscribed.push(userName);
          result.subscribedCount = ++subscribersCount;
          j++;
          await sleep(10000);
        } else {
          result.subscribedCount = subscribersCount;
          result.error = "LIMIT_REACHED";

          return result;
        }
      } else {
        j++;
      }
    }
    return result;
  } catch (e) {
    console.log(e);
    result.error = e.toString();
    return result;
  }
}

module.exports = async () => {
  const browser = await puppeteer.launch({
    headless: !process.env.HEADLESS,
    slowMo: 50
  });

  const page = await browser.newPage();

  await page.goto(`${process.env.API}/twitter-accs`);
  await page.waitFor(5000);

  const users = await axios
    .get(`${process.env.API}/twitter-accs?id=${process.env.USER_ID}`)
    .then(response => response.data);

  const targetUser = users[0];

  //If banned

  //If snoozed

  console.log(targetUser);

  try {
    await page.goto(twitterLoginPageUrl);
    await page.waitForSelector(emailInputSelector);
    await page.type(emailInputSelector, targetUser.login);
    await page.type(passwordInputSelector, targetUser.password);
    await page.click(loginBtnSelector);
    await page.waitFor(4000);

    //If banned

    //If confirm phone number

    //Set followers

    await page.goto(targetUser.post);
    await page.waitFor(2000);
  } catch (e) {
    console.log(e);
  }

  const result = await page.evaluate(subscribe, targetUser.subcribe);
  console.log(result);
  //snooze acc

  await axios.post(`${process.env.API}/bots-subs-stat`, {
    targetUser: targetUser.login,
    strategy: "TWITTER",
    ...result
  });

  await browser.close();
};

const puppeteer = require("puppeteer");
const axios = require("axios");

require("dotenv").config();

const twitterLoginPageUrl = "https://twitter.com/login";

const emailInputSelector = ".js-username-field.email-input";
const passwordInputSelector = ".js-password-field";
const loginBtnSelector =
  ".submit.EdgeButton.EdgeButton--primary.EdgeButtom--medium";

const ipSelector = "#ipv4 a";

async function subscribe(subsCount) {
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  const userCardSelector = ".GridTimeline-items .ProfileCard";
  const userSubscribeContainerSelector = ".user-actions";
  const subscribeBtnSelector = ".follow-text";
  const userNameSelector = ".u-linkComplex-target";
  const followingClass = "following";
  const protectedClass = "protected";

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

      if (
        !userSubscribeContainer.classList.contains(followingClass) &&
        !userSubscribeContainer.classList.contains(protectedClass)
      ) {
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

let serviceIp;

module.exports = async user => {
  const browser = await puppeteer.launch({
    headless: !process.env.HEADLESS,
    slowMo: 50
  });

  const page = await browser.newPage();

  page.goto("https://whatismyipaddress.com/");
  await page.waitForSelector(ipSelector);

  serviceIp = await page.evaluate(
    () => document.querySelector("#ipv4 a").innerText
  );

  //If banned

  //If snoozed

  try {
    await page.goto(twitterLoginPageUrl);
    await page.waitForSelector(emailInputSelector);
    await page.type(emailInputSelector, user.login);
    await page.type(passwordInputSelector, user.password);
    await page.click(loginBtnSelector);
    await page.waitFor(4000);

    //If banned

    //If confirm phone number

    await page.goto(`https://twitter.com/${user.login}`);
    await page.waitForSelector(".ProfileNav-item--followers");

    const followers = await page.evaluate(
      () =>
        document.querySelector(".ProfileNav-item--followers .ProfileNav-value")
          .textContent
    );
    const following = await page.evaluate(
      () =>
        document.querySelector(".ProfileNav-item--following .ProfileNav-value")
          .textContent
    );

    await axios.post(
      `${process.env.API}/promotion-users/${user._id}/followers`,
      {
        followers,
        following
      }
    );

    await page.goto(user.post);
    await page.waitFor(2000);
  } catch (e) {
    console.log(e);
  }

  const result = await page.evaluate(subscribe, user.subcribe);
  //snooze acc

  await axios.post(`${process.env.API}/bots-subs-stat`, {
    targetUser: user.login,
    strategy: "TWITTER",
    serviceIp,
    ...result
  });

  await browser.close();
};

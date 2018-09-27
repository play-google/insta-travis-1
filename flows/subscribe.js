const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

require("dotenv").config();

const instagramLoginUrl = "https://www.instagram.com/accounts/login/";
const loginFieldSelector = '[name="username"]';
const passwordFieldSelector = '[name="password"]';
const loginBtnSelector = ".oF4XW.sqdOP.L3NKy";
const showLikesSelector = ".HbPOm.y9v3U a";

async function subscribe(subsCount) {
  let subscribeTargetSelector = ".wo9IH";
  let targetUserNameSelector = `.FPmhX._0imsa`;
  let subsribeBtnSelector = `.oF4XW.sqdOP.L3NKy`;
  let subscribersContainer = ".wwxN2.GD3H5";

  let result = {
    subscribed: [],
    subscribedCount: 0,
    error: null
  };

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  try {
    for (let i = 0; i < 30; ++i) {
      document.querySelectorAll(subscribersContainer)[0].scrollTo(0, 25000);
      await sleep(100);
    }

    const subscribeTargets = [
      ...document.querySelectorAll(subscribeTargetSelector)
    ];

    let subscribersCount = 0;
    let j = 0;

    while (subscribersCount !== subsCount) {
      let subscribeTarget = subscribeTargets[j];
      let userName = subscribeTarget.querySelector(targetUserNameSelector).text;
      let subscribeBtn = subscribeTarget.querySelector(subsribeBtnSelector);

      if (subscribeBtn.classList.length === 3) {
        subscribeBtn.click();
        await sleep(2000);

        if (subscribeBtn.classList.length === 4) {
          result.subscribed.push(userName);
          await sleep(20000);
        } else {
          result.subscribedCount = subscribersCount;
          result.error = "LIMIT_REACHED";

          return result;
        }

        result.subscribedCount = ++subscribersCount;
        j++;
      } else {
        j++;
      }
    }

    return result;
  } catch (e) {
    result.error = e;
    return result;
  }
}

module.exports = async () => {
  const browser = await puppeteer.launch({
    headless: !process.env.HEADLESS,
    slowMo: 50
  });

  const page = await browser.newPage();

  await page.goto(process.env.API);
  await page.waitFor(5000);

  const users = await fetch(
    `${process.env.API}/insta-accs?id=${process.env.USER_ID}`
  ).then(response => response.json());

  const targetUser = users[0];

  try {
    await page.goto(instagramLoginUrl);
    await page.waitForSelector(loginFieldSelector);
    await page.type(loginFieldSelector, targetUser.login);
    await page.type(passwordFieldSelector, targetUser.password);
    await page.click(loginBtnSelector);
    await page.waitFor(2000);
    await page.goto(targetUser.post);
    await page.waitFor(2000);
    await page.click(showLikesSelector);
    await page.waitFor(2000);
  } catch (e) {
    console.log(e);

    await fetch(`${process.env.API}/email-accs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        sessionTime: new Date().toISOString(),
        targetUser: targetUser.login,
        error: "USER_BANNED",
        details: e.toString(),
        see: "SEEE"
      })
    });

    await browser.close();
  }

  const result = await page.evaluate(subscribe, targetUser.subcribe);

  await fetch(`${process.env.API}/email-accs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      sessionTime: new Date().toISOString(),
      targetUser: targetUser.login,
      ...result
    })
  });

  await browser.close();
};

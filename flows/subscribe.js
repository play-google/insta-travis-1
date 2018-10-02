const puppeteer = require("puppeteer");
const axios = require("axios");

require("dotenv").config();

const instagramLoginUrl = "https://www.instagram.com/accounts/login/";
const loginFieldSelector = '[name="username"]';
const passwordFieldSelector = '[name="password"]';
const loginBtnSelector = ".oF4XW.sqdOP.L3NKy";
const showLikesSelector = ".HbPOm.y9v3U a";
const bannedNotifSelector = "#slfErrorAlert";
const addPhoneNumberSelector = ".ZpgjG._1I5YO .AjK3K";
const followersCountSelector = ".Y8-fY:nth-of-type(2) .g47SY";
const followingCountSelector = ".Y8-fY:nth-of-type(3) .g47SY";

const userServiceReadySelector = "#app-ready";

async function subscribe(subsCount) {
  let subscribeTargetSelector = ".wo9IH";
  let targetUserNameSelector = `.FPmhX._0imsa`;
  let subsribeBtnSelector = `.oF4XW.sqdOP.L3NKy`;
  let subscribersContainer = ".wwxN2.GD3H5";

  let result = {
    subscribed: [],
    subscribedCount: 0,
    type: null
  };

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  try {
    for (let i = 0; i < 30; ++i) {
      document.querySelectorAll(subscribersContainer)[0].scrollTo(0, 25000);
      await sleep(100);
    }
  } catch (e) {
    return {
      ...result,
      type: "CANNOT SCROLL",
      details: e.toString()
    };
  }

  const subscribeTargets = [
    ...document.querySelectorAll(subscribeTargetSelector)
  ];

  if (subscribeTargets.length === 0) {
    return {
      ...result,
      type: "NO SUBS TARGETS",
      details: "NO SUBS TARGETS"
    };
  }

  let subscribersCount = 0;
  let j = 0;

  while (subscribersCount !== subsCount) {
    if (j >= subscribeTargets.length) {
      return {
        ...result,
        type: "NO PEOPLE TO FOLLOW",
        details: "NO PEOPLE TO FOLLOW"
      };
    }
    let subscribeTarget = subscribeTargets[j];
    let userToFollow = subscribeTarget.querySelector(targetUserNameSelector);
    let userName = userToFollow && userToFollow.text;
    let subscribeBtn = subscribeTarget.querySelector(subsribeBtnSelector);

    if (!subscribeTarget || !userName || !subscribeBtn) {
      return {
        ...result,
        type: "subscribeTarget || userName || subscribeBtn cannot be found",
        details: "subscribeTarget || userName || subscribeBtn cannot be found"
      };
    }

    if (!subscribeBtn.classList) {
      return {
        ...result,
        type: "subscribeBtn has no classList",
        details: "subscribeBtn has no classList"
      };
    }

    try {
      if (subscribeBtn.classList.length === 3) {
        subscribeBtn.click();
        await sleep(2000);

        if (subscribeBtn.classList.length === 4) {
          result.subscribed.push(userName);
          await sleep(25000);
        } else {
          return {
            ...result,
            subscribersCount,
            type: "LIMIT_REACHED",
            details: `Cannot subscribe to ${userName}`
          };
        }

        result.subscribedCount = ++subscribersCount;
        j++;
      } else {
        j++;
      }
    } catch (e) {
      return {
        ...result,
        subscribersCount,
        type: "UNHANDLED ERROR DURING SUBSCIPTION",
        details: e.toString()
      };
    }
  }

  return result;
}

async function reportError(user, { type, details }) {
  await axios.post(`${process.env.API}/bots-subs-stat`, {
    targetUser: user,
    error: type,
    details
  });
}

module.exports = async () => {
  const browser = await puppeteer.launch({
    headless: !process.env.HEADLESS,
    slowMo: 50
  });

  const page = await browser.newPage();

  try {
    await page.goto(`${process.env.API}/statistic`);
    await page.waitFor(userServiceReadySelector);
  } catch (e) {
    await reportError("USER_SERVICE", {
      type: "USER_SERVICE_IS_NOT_AVAILIABLE",
      details: e.toString()
    });
    process.exit(1);
  }

  let users, targetUser;

  try {
    users = await axios
      .get(`${process.env.API}/insta-accs?id=${process.env.USER_ID}`)
      .then(response => response.data);
    targetUser = users[0];
    if (!targetUser) throw "";
  } catch (e) {
    await reportError("USER_SERVICE", {
      type: "CANNOT_FETCH_USER",
      details: e.toString()
    });
    process.exit(1);
  }

  if (targetUser.banned) {
    process.exit(1);
  }

  if (targetUser.snooze) {
    await axios.get(`${process.env.API}/insta-accs/${targetUser._id}/unsnooze`);
    await reportError(targetUser.login, {
      type: "UNSNOOZE",
      details: `Left ${targetUser.snooze}`
    });

    process.exit(0);
  }

  /*   try { */
  try {
    await page.goto(instagramLoginUrl);
    await page.waitForSelector(loginFieldSelector);
  } catch (e) {
    await reportError(targetUser.login, {
      type: "CANNOT_LOAD_INSTA_PAGE",
      details: e.toString()
    });

    process.exit(1);
  }

  try {
    await page.type(loginFieldSelector, targetUser.login);
    await page.type(passwordFieldSelector, targetUser.password);
    await page.click(loginBtnSelector);
    await page.waitFor(4000);
  } catch (e) {
    await reportError(targetUser.login, {
      type: "CANNOT_ENTER_USER_CREDS",
      details: e.toString()
    });

    process.exit(1);
  }

  if (await page.$(bannedNotifSelector)) {
    await page.goto(`${process.env.API}/insta-accs`);
    await axios.get(`${process.env.API}/insta-accs/${targetUser._id}/ban`);
    await reportError(targetUser.login, {
      type: "USER_BANNED"
    });
    process.exit(1);
  }

  if (await page.$(addPhoneNumberSelector)) {
    await reportError(targetUser.login, {
      type: "ADD_PHONE_NUMBER_MODAL"
    });

    process.exit(1);
  }
  try {
    await page.goto(`https://www.instagram.com/${targetUser.login}/`);
    await page.waitForSelector(followersCountSelector);

    const followers = await page.evaluate(
      () => document.querySelector(".Y8-fY:nth-of-type(2) .g47SY").textContent
    );
    const following = await page.evaluate(
      () => document.querySelector(".Y8-fY:nth-of-type(3) .g47SY").textContent
    );

    await axios.post(
      `${process.env.API}/insta-accs/${targetUser._id}/followers`,
      {
        followers,
        following
      }
    );
  } catch (e) {
    await reportError(targetUser.login, {
      type: "CANNOT_LOAD_PROFILE_INFO_AND_GET_FOLLOWES_INFO",
      details: e.toString()
    });

    process.exit(1);
  }

  try {
    await page.goto(targetUser.post);
    await page.waitFor(2000);
    await page.click(showLikesSelector);
    await page.waitFor(2000);
  } catch (e) {
    await reportError(targetUser.login, {
      type: "CANNOT_LOAD_POST_OR_SHOW_LIKES",
      details: e.toString()
    });

    process.exit(1);
  }

  const result = await page.evaluate(subscribe, targetUser.subcribe);

  if (result.type) {
    await reportError(targetUser.login, {
      targetUser: targetUser.login,
      ...result
    });
    if (result.type === "LIMIT_REACHED") {
      await axios.get(`${process.env.API}/insta-accs/${targetUser._id}/snooze`);
      process.exit(0);
    } else {
      process.exit(1);
    }
  } else {
    await reportError(targetUser.login, {
      targetUser: targetUser.login,
      ...result
    });
    process.exit(0);
  }
};

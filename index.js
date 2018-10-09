/* const myIpFlow = require("./flows/my-ip"); */
const subscribeFlow = require("./flows/instagram-subscribe");
const twitterFlow = require("./flows/twitter-subscribe");
const rerunFlow = require("./flows/travis-rerun");

(async () => {
  /*   await twitterFlow(); */
  await subscribeFlow();
  /*  setInterval(() => {
    rerunFlow();
  }, 15 * 60 * 1000); */
})();

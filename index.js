/* const myIpFlow = require("./flows/my-ip"); */
const subscribeFlow = require("./flows/subscribe");
const rerunFlow = require("./flows/travis-rerun");

(async () => {
  await subscribeFlow();
  /*   setInterval(() => {
    rerunFlow();
  }, 15 * 60 * 1000); */
})();

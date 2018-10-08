/* const myIpFlow = require("./flows/my-ip"); */
const subscribeFlow = require("./flows/subscribe");
const twitterFlow = require("./flows/twitter-subscribe");
const rerunFlow = require("./flows/travis-rerun");

(async () => {
  await twitterFlow();
  /*   await subscribeFlow(); */
  /*  setInterval(() => {
    rerunFlow();
  }, 15 * 60 * 1000); */
})();

/* Do you want to get 50⬆ followers? 
Rules:
1. Download an app 📲 from #GooglePlay (Link in the bio!) 
2. Play 2 rounds 🎮. 
3. Send me a message with a screenshot of an app 💌. 
In 1 hour you will get ☝50 free followers! 
#followback #F4F #follow4follow #followme */

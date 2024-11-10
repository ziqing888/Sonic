import { account } from "./account.js";
import { proxyList } from "./proxy_list.js";
import { Solana } from "./src/core/solana.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";

// 操作函数，执行主要任务
async function operation(acc, proxy) {
  const solana = new Solana(acc, proxy);
  try {
    await solana.connectWallet();
    await solana.checkBalance();
    if (solana.balance < 0.01) {
      throw Error("您需要至少 0.01 SOL 才能使用此 BOT");
    }
    await solana.connect();
    await Helper.delay(500, acc, `获取钱包余额信息`, solana);
    await solana.getRewardInfo();
    await solana.getDailyTx();
    await solana.checkIn();
    await Helper.delay(500, acc, `开始批量交易`, solana);

    if (100 - solana.dailyTx.total_transactions > 0) {
      while (solana.dailyTx.total_transactions <= 100) {
        await solana.sendSolToAddress(acc);
        const randWait = Helper.random(1000, 3000);
        await Helper.delay(randWait, acc, "下一个交易前的延迟", solana);
      }
    }

    await solana.getDailyTx();

    const claimableStage = [];
    if (solana.dailyTx.total_transactions >= 10) {
      claimableStage.push(1);
    }
    if (solana.dailyTx.total_transactions >= 50) {
      claimableStage.push(2);
    }
    if (solana.dailyTx.total_transactions >= 100) {
      claimableStage.push(3);
    }

    for (const stage of claimableStage) {
      await solana.claimTxMilestone(stage);
    }

    await solana.getRewardInfo();
    await Helper.delay(
      500,
      acc,
      `打开 ${solana.reward.ring_monitor} 神秘盒子`,
      solana
    );

    while (solana.reward.ring_monitor != 0) {
      await solana.claimMysteryBox().catch(async (err) => {
        if (err.message.includes("custom program error")) {
          await Helper.delay(
            3000,
            acc,
            `领取神秘盒子时出错，可能是 Sonic 程序错误，跳过打开盒子`,
            solana
          );
        }
      });
      await solana.getRewardInfo();
    }

    await Helper.delay(
      60000 * 60 * 24,
      acc,
      `账户处理完成，延迟 24 小时`,
      solana
    );
  } catch (error) {
    let msg = error.message;
    if (msg.includes("<!DOCTYPE html>")) {
      msg = msg.split("<!DOCTYPE html>")[0];
    }
    await Helper.delay(
      500,
      acc,
      `错误 ${msg}，将在 10 秒后重试账户 ${
        account.indexOf(acc) + 1
      }...`,
      solana
    );

    logger.info(`重试账户 ${account.indexOf(acc) + 1}...`);
    logger.error(error);
    await Helper.delay(10000);
    await operation(acc, proxy);
  }
}

// 处理未捕获的 Promise 拒绝
process.on("unhandledRejection", (reason) => {
  throw Error("未处理的异常: " + reason);
});

// 启动机器人
async function startBot() {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info(`BOT 已启动`);
      if (account.length == 0)
        throw Error("请首先在 account.js 文件中输入您的账户");

      if (proxyList.length != account.length && proxyList.length != 0)
        throw Error(
          `您有 ${account.length} 个账户，但提供了 ${proxyList.length} 个代理`
        );

      const promiseList = [];

      for (const acc of account) {
        const accIdx = account.indexOf(acc);
        const proxy = proxyList[accIdx];
        promiseList.push(operation(acc, proxy));
      }

      await Promise.all(promiseList);
      resolve();
    } catch (error) {
      logger.info(`BOT 已停止`);
      logger.error(JSON.stringify(error));
      reject(error);
    }
  });
}

// 立即启动机器人
(async () => {
  try {
    logger.clear();
    logger.info("");
    logger.info("应用程序已启动");

    // 自定义 LOGO
    console.log(`\x1b[33m╔════════════════════════════════════════╗`);
    console.log(`\x1b[33m║      🚀 SONIC ODYSSEY 机器人 🚀       ║`);
    console.log(`\x1b[33m║  👤    脚本编写：@qklxsqf              ║`);
    console.log(`\x1b[33m║  📢  电报频道：https://t.me/ksqxszq    ║`);
    console.log(`\x1b[33m╚════════════════════════════════════════╝\x1b[0m`);

    await startBot();
  } catch (error) {
    console.log("执行机器人时出错", error);
    await startBot();
  }
})();

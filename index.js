import { account } from "./account.js";
import { proxyList } from "./proxy_list.js";
import { Solana } from "./src/core/solana.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";

function printLogo() {
  const logo = `
\x1b[33m╔════════════════════════════════════════╗
\x1b[33m║      🚀  hanafuda自动工具 🚀           ║
\x1b[33m║  📢  电报频道：https://t.me/ksqxszq    ║
\x1b[33m╚════════════════════════════════════════╝\x1b[0m
`;
  console.log(logo);
}

async function operation(acc, proxy) {
  const solana = new Solana(acc, proxy);
  try {
    await solana.connectWallet();
    await solana.checkBalance();
    if (solana.balance < 0.01) {
      throw Error("您的钱包至少需要 0.01 SOL 才能使用此机器人");
    }
    await solana.connect();
    await Helper.delay(500, acc, `正在获取钱包余额信息`, solana);
    await solana.getRewardInfo();
    await solana.getDailyTx();
    await solana.checkIn();
    await Helper.delay(500, acc, `开始进行批量交易`, solana);

    if (100 - solana.dailyTx.total_transactions > 0) {
      while (solana.dailyTx.total_transactions <= 100) {
        await solana.sendSolToAddress(acc);
        const randWait = Helper.random(1000, 3000);
        await Helper.delay(randWait, acc, "交易后等待下一次交易", solana);
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
      `正在开启 ${solana.reward.ring_monitor} 神秘盒子`,
      solana
    );

    while (solana.reward.ring_monitor != 0) {
      await solana.claimMysteryBox().catch(async (err) => {
        if (err.message.includes("custom program error")) {
          await Helper.delay(
            3000,
            acc,
            `领取神秘盒子时出现错误，可能是 Sonic 程序错误，跳过此次操作`,
            solana
          );
        }
      });
      await solana.getRewardInfo();
    }

    await Helper.delay(
      60000 * 60 * 24,
      acc,
      `账户处理完成，暂停 24 小时`,
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
      `发生错误: ${msg}, 10 秒后重新尝试使用账户 ${
        account.indexOf(acc) + 1
      }...`,
      solana
    );

    logger.info(`重新尝试使用账户 ${account.indexOf(acc) + 1}...`);
    logger.error(error);
    await Helper.delay(10000);
    await operation(acc, proxy);
  }
}

process.on("unhandledRejection", (reason) => {
  throw Error("未处理的异常: " + reason);
});

async function startBot() {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info(`机器人启动成功`);
      if (account.length == 0)
        throw Error("请先在 account.js 文件中输入您的账户信息");

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
      logger.info(`机器人已停止`);
      logger.error(JSON.stringify(error));
      reject(error);
    }
  });
}

(async () => {
  try {
    logger.clear();
    logger.info("");
    logger.info("应用已启动");
    printLogo(); 
    await startBot();
  } catch (error) {
    console.log("执行机器人时发生错误", error);
    await startBot();
  }
})();

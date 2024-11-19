import { account } from "./account.js";
import { proxyList } from "./proxy_list.js";
import { Solana } from "./src/core/solana.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";

const batchSize = 5; // 每批运行的账户数量

async function operation(acc, proxy) {
  const solana = new Solana(acc, proxy);
  while (true) {
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

      while (solana.dailyTx.total_transactions < 100) {
        await solana.sendSolToAddress(acc);
        const randWait = Helper.random(1000, 3000);
        await Helper.delay(randWait, acc, "下一个交易前的延迟", solana);
        await solana.getDailyTx();
      }

      const claimableStage = [1, 2, 3].filter(
        (stage) => solana.dailyTx.total_transactions >= stage * 10
      );
      for (const stage of claimableStage) {
        await solana.claimTxMilestone(stage);
      }

      await solana.getRewardInfo();
      while (solana.reward.ring_monitor > 0) {
        try {
          await solana.claimMysteryBox();
        } catch (err) {
          if (err.message.includes("custom program error")) {
            await Helper.delay(
              3000,
              acc,
              `领取神秘盒子时出错，可能是 Sonic 程序错误，跳过打开盒子`,
              solana
            );
          } else {
            throw err;
          }
        }
        await solana.getRewardInfo();
      }

      await Helper.delay(
        60000 * 60 * 24,
        acc,
        `账户处理完成，延迟 24 小时`,
        solana
      );
      break; // 成功完成操作后退出循环
    } catch (error) {
      let msg = error.message;
      if (msg.includes("<!DOCTYPE html>")) {
        msg = msg.split("<!DOCTYPE html>")[0];
      }

      logger.error(
        `账户 ${account.indexOf(acc) + 1} 错误: ${msg}，将在 10 秒后重试`
      );
      await Helper.delay(10000, acc, `重试操作中...`, solana);
    }
  }
}

async function runBatch(startIndex, endIndex) {
  const tasks = [];
  for (let i = startIndex; i < endIndex; i++) {
    const acc = account[i];
    const proxy = proxyList[i];
    tasks.push(operation(acc, proxy));
  }
  await Promise.all(tasks);
}

async function startBot() {
  try {
    logger.info(`BOT 已启动`);
    if (account.length === 0) {
      throw Error("请首先在 account.js 文件中输入您的账户");
    }

    if (proxyList.length !== account.length && proxyList.length > 0) {
      throw Error(
        `代理列表数量不匹配: 您有 ${account.length} 个账户，但提供了 ${proxyList.length} 个代理`
      );
    }

    const totalAccounts = account.length;
    for (let i = 0; i < totalAccounts; i += batchSize) {
      const startIndex = i;
      const endIndex = Math.min(i + batchSize, totalAccounts);
      logger.info(`运行账户批次: ${startIndex + 1} - ${endIndex}`);
      await runBatch(startIndex, endIndex);
      logger.info(`批次 ${startIndex + 1} - ${endIndex} 完成`);
    }

    logger.info("所有账户已处理完成");
  } catch (error) {
    logger.error(`BOT 已停止: ${error.message}`);
    throw error;
  }
}

// 启动 LOGO 输出
function printLogo() {
  const logo = `
\x1b[33m╔════════════════════════════════════════╗
\x1b[33m║      🚀  索尼克--机器人 🚀             ║
\x1b[33m║  👤    脚本编写：@qklxsqf              ║
\x1b[33m║  📢  电报频道：https://t.me/ksqxszq    ║
\x1b[33m╚════════════════════════════════════════╝\x1b[0m
`;
  console.log(logo);
}

// 主程序
(async () => {
  try {
    logger.clear();
    printLogo();
    await startBot();
  } catch (error) {
    logger.error(`程序运行中发生错误: ${error.message}`);
  }
})();

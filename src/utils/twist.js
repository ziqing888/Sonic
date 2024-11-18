import { Twisters } from "twisters";
import { account } from "../../account.js";
import { Solana } from "../core/solana.js";
import logger from "./logger.js";

// Twist 类
class Twist {
  constructor() {
    /** @type  {Twisters} */
    this.twisters = new Twisters();
  }

  /**
   * 记录账户状态
   * @param {string} acc - 账户
   * @param {Solana} solana - Solana 实例（可选）
   * @param {string} msg - 信息
   * @param {number} delay - 延迟时间（可选）
   */
  log(msg = "", acc = "", solana = null, delay = undefined) {
    const accIdx = account.indexOf(acc);

    if (accIdx === -1) {
      logger.error(`未找到账户: ${acc}`);
      return;
    }

    // 确保有 Solana 实例
    if (!solana) {
      solana = new Solana(acc);
    }

    // 默认延迟
    delay = delay !== undefined ? `${delay} ms` : "-";

    // 获取 Solana 数据
    const address = solana.address ?? "-";
    const balance = solana.balance ?? "-";
    const reward = solana.reward ?? {};
    const ring = reward.ring ?? "?";
    const ringMonitor = reward.ring_monitor ?? "-";
    const dailyTx = solana.dailyTx ?? {};
    const totalTransactions = dailyTx.total_transactions ?? "-";

    // 记录日志
    logger.info(`账户 ${accIdx + 1} - ${msg}`);

    // 显示账户状态
    this.twisters.put(acc, {
      text: `
================= 账户 ${accIdx + 1} ==================
钱包地址         : ${address}
余额             : ${balance} SOL | ${ring} RING
神秘盒子         : ${ringMonitor}
每日交易         : ${totalTransactions}

状态             : ${msg}
延迟             : ${delay}
========================================================
`,
    });
  }

  /**
   * 显示信息
   * @param {string} msg - 信息
   */
  info(msg = "") {
    this.twisters.put(2, {
      text: `
========================================================
信息             : ${msg}
========================================================`,
    });
  }

  /**
   * 清除信息
   */
  clearInfo() {
    this.twisters.remove(2);
  }

  /**
   * 清除账户状态
   * @param {string} acc - 账户
   */
  clear(acc) {
    this.twisters.remove(acc);
  }
}

export default new Twist();

import { Twisters } from "twisters"; // 引入 Twisters 模块
import { account } from "../../account.js"; // 引入账户模块
import { Solana } from "../core/solana.js"; // 引入 Solana 核心模块
import logger from "./logger.js"; // 引入日志记录器模块

class Twist {
  constructor() {
    /** @type  {Twisters} */
    this.twisters = new Twisters(); // 初始化 Twisters 实例
  }

  /**
   * 记录日志信息
   * @param {string} msg 日志消息
   * @param {string} acc 账户标识
   * @param {Solana} solana Solana 实例
   * @param {number} delay 延迟时间
   */
  log(msg = "", acc = "", solana = new Solana(acc), delay) {
    // 获取账户索引
    const accIdx = account.indexOf(acc);
    if (delay == undefined) {
      logger.info(`账户 ${accIdx + 1} - ${msg}`);
      delay = "-";
    }

    // 获取钱包地址、余额、奖励及交易信息
    const address = solana.address ?? "-";
    const balance = solana.balance ?? "-";
    const reward = solana.reward ?? {};
    const ring = reward.ring ?? "?";
    const ring_monitor = reward.ring_monitor ?? "-";
    const dailyTx = solana.dailyTx ?? {};
    const total_transactions = dailyTx.total_transactions ?? "-";

    // 设置 Twisters 显示的日志内容
    this.twisters.put(acc, {
      text: `
================= 账户 ${account.indexOf(acc) + 1} =============
钱包地址         : ${address}
余额             : ${balance} SOL | ${ring} RING
神秘宝箱         : ${ring_monitor}
每日交易         : ${total_transactions}

状态             : ${msg}
延迟时间         : ${delay}
==============================================
`,
    });
  }

  /**
   * 显示一般信息
   * @param {string} msg 信息内容
   */
  info(msg = "") {
    this.twisters.put(2, {
      text: `
==============================================
信息 : ${msg}
==============================================`,
    });
    return;
  }

  // 清除信息显示
  clearInfo() {
    this.twisters.remove(2);
  }

  // 清除指定账户的显示
  clear(acc) {
    this.twisters.remove(acc);
  }
}

export default new Twist(); // 导出 Twist 实例

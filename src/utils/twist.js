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
   * @param {Solana} solana - Solana 实例
   * @param {string} msg - 信息
   * @param {number} delay - 延迟时间
   */
  log(msg = "", acc = "", solana = new Solana(acc), delay) {
    const accIdx = account.indexOf(acc);
    if (delay == undefined) {
      logger.info(`账户 ${accIdx + 1} - ${msg}`);
      delay = "-";
    }

    const address = solana.address ?? "-";
    const balance = solana.balance ?? "-";
    const reward = solana.reward ?? {};
    const ring = reward.ring ?? "?";
    const ring_monitor = reward.ring_monitor ?? "-";
    const dailyTx = solana.dailyTx ?? {};
    const total_transactions = dailyTx.total_transactions ?? "-";

    this.twisters.put(acc, {
      text: `
================= 账户 ${account.indexOf(acc) + 1} =============
钱包地址         : ${address}
余额             : ${balance} SOL | ${ring} RING
神秘盒子         : ${ring_monitor}
每日交易         : ${total_transactions}

状态             : ${msg}
延迟             : ${delay}
==============================================
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
==============================================
信息 : ${msg}
==============================================`,
    });
    return;
  }

  // 清除信息
  clearInfo() {
    this.twisters.remove(2);
  }

  // 清除账户状态
  clear(acc) {
    this.twisters.remove(acc);
  }
}
export default new Twist();

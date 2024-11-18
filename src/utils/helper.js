import bs58 from "bs58";
import twist from "./twist.js";
import chalk from "chalk"; // 默认导入 chalk 模块

// Helper 类
export class Helper {
  // 将 Base58 格式的私钥解码
  static base58decoder(base58PrivateKey) {
    try {
      return bs58.decode(base58PrivateKey);
    } catch (error) {
      throw new Error(`Base58 解码失败: ${error.message}`);
    }
  }

  // 延迟执行
  static delay(ms, acc, msg, obj) {
    return new Promise(async (resolve) => {
      if (acc !== undefined) {
        await twist.log(msg, acc, obj, `延迟 ${this.msToTime(ms)}`);
      } else {
        twist.info(`延迟 ${this.msToTime(ms)}`);
      }

      const interval = setInterval(async () => {
        ms -= 1000;
        const timeLeft = this.msToTime(ms);
        if (ms <= 0) {
          clearInterval(interval);
          await twist.clearInfo();
          if (acc) await twist.log(msg, acc, obj);
          resolve();
        } else {
          if (acc !== undefined) {
            await twist.log(msg, acc, obj, `延迟 ${timeLeft}`);
          } else {
            twist.info(`延迟 ${timeLeft}`);
          }
        }
      }, 1000);
    });
  }

  // 生成指定范围的随机数
  static random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 随机生成用户代理字符串
  static randomUserAgent() {
    const userAgents = [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/125.2535.60 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; VOG-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
      "Mozilla/5.0 (Linux; Android 10; SM-N975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  // 将毫秒数转换为时、分、秒格式
  static msToTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return [
      hours > 0 ? `${hours} 小时` : "",
      minutes > 0 ? `${minutes} 分钟` : "",
      `${seconds} 秒`,
    ]
      .filter((str) => str !== "")
      .join(" ");
  }

  // 显示自定义 ASCII 艺术 Logo
  static showSkelLogo(title = "hanafuda自动工具", author = "@qklxsqf", channel = "https://t.me/ksqxszq") {
    console.log(`
      ${chalk.yellow("╔════════════════════════════════════════╗")}
      ${chalk.yellow(`║      🚀  ${title} 🚀           ║`)}
      ${chalk.yellow(`║  👤    脚本编写：${author}              ║`)}
      ${chalk.yellow(`║  📢  电报频道：${channel}    ║`)}
      ${chalk.yellow("╚════════════════════════════════════════╝")}${chalk.reset()}
    `);
  }
}

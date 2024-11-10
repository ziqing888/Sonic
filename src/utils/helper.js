import bs58 from "bs58";
import twist from "./twist.js";
import chalk from "chalk"; // 默认导入 chalk 模块

// Helper 类
export class Helper {
  // 将 Base58 格式的私钥解码
  static base58decoder(base58PrivateKey) {
    try {
      const privateKeyBuffer = bs58.decode(base58PrivateKey);
      return privateKeyBuffer;
    } catch (error) {
      throw error;
    }
  }

  // 延迟执行
  static delay = (ms, acc, msg, obj) => {
    return new Promise(async (resolve) => {
      let remainingMilliseconds = ms;

      if (acc != undefined) {
        await twist.log(msg, acc, obj, `延迟 ${this.msToTime(ms)}`);
      } else {
        twist.info(`延迟 ${this.msToTime(ms)}`);
      }

      const interval = setInterval(async () => {
        remainingMilliseconds -= 1000;
        if (acc != undefined) {
          await twist.log(
            msg,
            acc,
            obj,
            `延迟 ${this.msToTime(remainingMilliseconds)}`
          );
        } else {
          twist.info(`延迟 ${this.msToTime(remainingMilliseconds)}`);
        }

        if (remainingMilliseconds <= 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);

      setTimeout(async () => {
        clearInterval(interval);
        await twist.clearInfo();
        if (acc) {
          await twist.log(msg, acc, obj);
        }
        resolve();
      }, ms);
    });
  };

  // 生成指定范围的随机数
  static random(min, max) {
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;
    return rand;
  }

  // 随机生成用户代理字符串
  static randomUserAgent() {
    const list_useragent = [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/125.2535.60 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; VOG-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
      "Mozilla/5.0 (Linux; Android 10; SM-N975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
    ];
    return list_useragent[Math.floor(Math.random() * list_useragent.length)];
  }

  // 将毫秒数转换为时、分、秒格式
  static msToTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const remainingMillisecondsAfterHours = milliseconds % (1000 * 60 * 60);
    const minutes = Math.floor(remainingMillisecondsAfterHours / (1000 * 60));
    const remainingMillisecondsAfterMinutes =
      remainingMillisecondsAfterHours % (1000 * 60);
    const seconds = Math.round(remainingMillisecondsAfterMinutes / 1000);

    return `${hours} 小时 ${minutes} 分钟 ${seconds} 秒`;
  }

  // 显示自定义 ASCII 艺术 Logo
  static showSkelLogo() {
    console.log(`
      ${chalk.yellow('╔════════════════════════════════════════╗')}
      ${chalk.yellow('║      🚀 Sonic 奥德赛 机器人🚀         ║')}
      ${chalk.yellow('║  👤    脚本编写：@qklxsqf              ║')}
      ${chalk.yellow('║  📢  电报频道：https://t.me/ksqxszq    ║')}
      ${chalk.yellow('╚════════════════════════════════════════╝')}${chalk.reset()}
    `);
  }
}


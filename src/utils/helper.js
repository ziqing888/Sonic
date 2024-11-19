import bs58 from "bs58"; // 引入 bs58 编解码库
import chalk from "chalk"; // 引入 chalk 模块用于着色
import twist from "./twist.js"; // 引入自定义的 twist 模块

export class Helper {
  // Base58 解码器
  static base58decoder(base58PrivateKey) {
    try {
      // 将 Base58 格式的私钥解码为 Buffer
      const privateKeyBuffer = bs58.decode(base58PrivateKey);
      return privateKeyBuffer;
    } catch (error) {
      throw error; // 抛出解码异常
    }
  }

  // 延迟执行函数，支持记录日志
  static delay = (ms, acc, msg, obj) => {
    return new Promise(async (resolve) => {
      let remainingMilliseconds = ms; // 剩余毫秒数

      // 如果指定了账户，记录延迟日志
      if (acc != undefined) {
        await twist.log(msg, acc, obj, `延迟中: ${this.msToTime(ms)}`);
      } else {
        twist.info(`延迟中: ${this.msToTime(ms)}`);
      }

      // 每秒更新一次剩余时间
      const interval = setInterval(async () => {
        remainingMilliseconds -= 1000; // 每次减少 1000 毫秒
        if (acc != undefined) {
          await twist.log(
            msg,
            acc,
            obj,
            `延迟中: ${this.msToTime(remainingMilliseconds)}`
          );
        } else {
          twist.info(`延迟中: ${this.msToTime(remainingMilliseconds)}`);
        }

        // 时间结束时清除计时器
        if (remainingMilliseconds <= 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);

      // 在指定延迟时间后清除日志并完成
      setTimeout(async () => {
        clearInterval(interval);
        await twist.clearInfo(); // 清除延迟信息
        if (acc) {
          await twist.log(msg, acc, obj); // 记录最终日志
        }
        resolve();
      }, ms);
    });
  };

  // 生成指定范围内的随机数
  static random(min, max) {
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;
    return rand;
  }

  // 随机生成用户代理（User-Agent）
  static randomUserAgent() {
    const list_useragent = [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/125.2535.60 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 EdgA/124.0.2478.104",
      "Mozilla/5.0 (Linux; Android 10; VOG-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
      "Mozilla/5.0 (Linux; Android 10; SM-N975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36 OPR/76.2.4027.73374",
    ];
    // 随机返回列表中的一个用户代理
    return list_useragent[Math.floor(Math.random() * list_useragent.length)];
  }

  // 将毫秒数转换为时间格式
  static msToTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60)); // 转换为小时
    const remainingMillisecondsAfterHours = milliseconds % (1000 * 60 * 60);
    const minutes = Math.floor(remainingMillisecondsAfterHours / (1000 * 60)); // 转换为分钟
    const remainingMillisecondsAfterMinutes =
      remainingMillisecondsAfterHours % (1000 * 60);
    const seconds = Math.round(remainingMillisecondsAfterMinutes / 1000); // 转换为秒

    return `${hours} 小时 ${minutes} 分钟 ${seconds} 秒`;
  }

  // 显示自定义的 logo
  static showSkelLogo(
    title = "Sonic-Odyssey bot", // 默认标题
    author = "@qklxsqf", // 默认作者
    channel = "https://t.me/ksqxszq" // 默认频道
  ) {
    console.log(`
      ${chalk.yellow("╔════════════════════════════════════════╗")}
      ${chalk.yellow(`║      🚀  ${title} 🚀           ║`)}
      ${chalk.yellow(`║  👤    脚本编写：${author}              ║`)}
      ${chalk.yellow(`║  📢  电报频道：${channel}    ║`)}
      ${chalk.yellow("╚════════════════════════════════════════╝")}
      ${chalk.reset()}
    `);
  }
}

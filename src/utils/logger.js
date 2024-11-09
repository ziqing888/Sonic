import { createLogger, format, transports } from "winston";
import fs from "fs";
const { combine, timestamp, printf, colorize } = format;

// 自定义日志格式
const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Logger 类
class Logger {
  constructor() {
    this.logger = createLogger({
      level: "debug", // 默认日志级别
      format: combine(
        timestamp({
          format: "YYYY-MM-DD HH:mm:ss", // 时间戳格式
        }),
        colorize(), // 日志内容颜色
        customFormat // 使用自定义格式
      ),
      transports: [
        new transports.File({ filename: "log/app.log" }) // 输出到文件
      ],
      exceptionHandlers: [
        new transports.File({ filename: "log/app.log" }) // 异常处理文件
      ],
      rejectionHandlers: [
        new transports.File({ filename: "log/app.log" }) // Promise 拒绝处理文件
      ],
    });
  }

  // 记录信息级别日志
  info(message) {
    this.logger.info(message);
  }

  // 记录警告级别日志
  warn(message) {
    this.logger.warn(message);
  }

  // 记录错误级别日志
  error(message) {
    this.logger.error(message);
  }

  // 记录调试级别日志
  debug(message) {
    this.logger.debug(message);
  }

  // 设置日志级别
  setLevel(level) {
    this.logger.level = level;
  }

  // 清空日志文件
  clear() {
    fs.truncate("log/app.log", 0, (err) => {
      if (err) {
        this.logger.error("清空日志文件失败: " + err.message);
      } else {
        this.logger.info("日志文件已清空");
      }
    });
  }
}

export default new Logger();

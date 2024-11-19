import { createLogger, format, transports } from "winston"; // 引入 Winston 日志模块
import fs from "fs"; // 引入文件系统模块
const { combine, timestamp, printf, colorize } = format; // 从格式化模块中解构需要的函数

// 自定义日志格式
const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`; // 定义日志的输出格式
});

class Logger {
  constructor() {
    // 配置日志记录器
    this.logger = createLogger({
      level: "debug", // 默认日志级别为 debug
      format: combine(
        timestamp({
          format: "YYYY-MM-DD HH:mm:ss", // 时间戳格式
        }),
        colorize(), // 日志级别着色
        customFormat // 自定义格式
      ),
      transports: [
        new transports.File({ filename: "log/app.log" }), // 将日志保存到文件 log/app.log
      ],
      // 处理未捕获的异常
      exceptionHandlers: [new transports.File({ filename: "log/app.log" })],
      // 处理未处理的 promise 拒绝
      rejectionHandlers: [new transports.File({ filename: "log/app.log" })],
    });
  }

  // 记录 info 级别日志
  info(message) {
    this.logger.info(message);
  }

  // 记录 warn 级别日志
  warn(message) {
    this.logger.warn(message);
  }

  // 记录 error 级别日志
  error(message) {
    this.logger.error(message);
  }

  // 记录 debug 级别日志
  debug(message) {
    this.logger.debug(message);
  }

  // 设置日志记录级别
  setLevel(level) {
    this.logger.level = level;
  }

  // 清空日志文件
  clear() {
    fs.truncate("log/app.log", 0, (err) => {
      if (err) {
        this.logger.error("清空日志文件失败: " + err.message); // 如果清空失败，记录错误日志
      } else {
        this.logger.info("日志文件已清空"); // 清空成功，记录提示信息
      }
    });
  }
}

export default new Logger(); // 导出 Logger 实例

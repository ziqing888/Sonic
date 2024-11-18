import { createLogger, format, transports } from "winston";
import fs from "fs";
const { combine, timestamp, printf } = format;

// 自定义日志格式
const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// 检查日志目录是否存在并创建
if (!fs.existsSync("log")) {
  fs.mkdirSync("log", { recursive: true });
}

// Logger 类
class Logger {
  constructor() {
    // 动态生成日志文件名
    const logFileName = `log/app-${new Date().toISOString().split("T")[0]}.log`;

    this.logger = createLogger({
      level: "debug", // 默认日志级别
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // 时间戳格式
        customFormat // 自定义日志格式
      ),
      transports: [
        // 移除 Console 输出，仅保留文件输出
        new transports.File({ filename: logFileName }), // 输出到文件
      ],
      exceptionHandlers: [
        new transports.File({ filename: logFileName }), // 捕获异常日志
      ],
      rejectionHandlers: [
        new transports.File({ filename: logFileName }), // 捕获未处理的 Promise 拒绝
      ],
    });

    this.logFileName = logFileName; // 保存日志文件名以供清空等操作使用
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
  clear(callback) {
    fs.truncate(this.logFileName, 0, (err) => {
      if (err) {
        this.logger.error(`清空日志文件失败: ${err.message}`);
        if (callback) callback(err);
      } else {
        this.logger.info("日志文件已清空");
        if (callback) callback(null);
      }
    });
  }
}

// 导出 Logger 实例
export default new Logger();

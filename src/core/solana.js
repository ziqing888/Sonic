import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Helper } from "../utils/helper.js";
import { Config } from "../config/config.js";
import nacl from "tweetnacl";
import { API } from "../api/api.js";
import logger from "../utils/logger.js";

// 常量配置
const DELAY_MS = 1000;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

// Solana 类
export class Solana extends API {
  constructor(pk, proxy) {
    const apiUrl = "https://odyssey-api-beta.sonic.game";
    super(apiUrl, proxy);
    this.pk = pk;
    this.draw = 0;
    this.lottery = 0;
    this.currentError = 0;
    this.connection = new Connection(
      "https://api.testnet.sonic.game",
      "confirmed"
    );
  }

  // 错误处理
  handleError(err, context) {
    logger.error(`${context} 发生错误: ${err.message}`);
    throw err;
  }

  // 重试逻辑
  async retry(fn, retries = MAX_RETRIES, delayMs = RETRY_DELAY_MS, context = "") {
    let attempts = 0;
    while (attempts < retries) {
      try {
        return await fn();
      } catch (err) {
        attempts++;
        logger.error(`重试失败 (${attempts}/${retries}): ${context}`);
        if (attempts >= retries) {
          throw new Error(`最大重试次数已达到: ${context}`);
        }
        await Helper.delay(delayMs);
      }
    }
  }

  // 获取 Token
  async getToken() {
    if (!this.token) {
      await this.connect();
    }
    return this.token;
  }

  // 连接钱包
  async connectWallet() {
    try {
      const privateKeyBuffer = Helper.base58decoder(this.pk);
      this.wallet = Keypair.fromSecretKey(privateKeyBuffer);
      this.address = new PublicKey(this.wallet.publicKey.toBase58());
    } catch (error) {
      this.handleError(error, "连接钱包");
    }
  }

  // 连接到 Sonic Odyssey
  async connect() {
    try {
      logger.info(`连接到 Sonic Odyssey`);
      const challengeResponse = await this.fetch(
        `/testnet-v1/auth/sonic/challenge?wallet=${this.address}`,
        "GET",
        undefined,
        null,
        "omit"
      );
      const message = challengeResponse.data;
      const messageBytes = new TextEncoder().encode(message);
      const signature = nacl.sign.detached(messageBytes, this.wallet.secretKey);
      const signatureBase64 = Buffer.from(signature).toString("base64");
      const addressEncoded = Buffer.from(this.wallet.publicKey.toBytes()).toString("base64");

      const authResponse = await this.fetch(
        `/testnet-v1/auth/sonic/authorize`,
        "POST",
        undefined,
        {
          address: this.address.toBase58(),
          address_encoded: addressEncoded,
          signature: signatureBase64,
        },
        "omit"
      );

      if (authResponse.code === 0) {
        this.token = authResponse.data.token;
        logger.info(`成功连接到 Sonic Odyssey`);
        await Helper.delay(DELAY_MS, this.pk, `已成功连接到 Sonic Odyssey`, this);
      } else {
        throw new Error(authResponse.message);
      }
    } catch (err) {
      this.handleError(err, "连接到 Sonic Odyssey");
    }
  }

  // 检查余额
  async checkBalance() {
    try {
      this.balance =
        (await this.connection.getBalance(this.address)) / LAMPORTS_PER_SOL;
      logger.info(`当前余额: ${this.balance} SOL`);
    } catch (error) {
      this.handleError(error, "检查余额");
    }
  }

  // 获取奖励信息
  async getRewardInfo() {
    try {
      logger.info(`获取奖励信息`);
      const data = await this.fetch("/testnet-v1/user/rewards/info", "GET", await this.getToken());

      if (data.code === 0) {
        this.reward = data.data;
        logger.info(`成功获取奖励信息: ${JSON.stringify(this.reward)}`);
      } else {
        throw new Error(`无法获取奖励信息: ${data.message}`);
      }
    } catch (error) {
      this.handleError(error, "获取奖励信息");
    }
  }

  // 获取每日交易信息
  async getDailyTx() {
    try {
      logger.info(`获取每日交易信息`);
      const data = await this.fetch(
        `/testnet-v1/user/transactions/state/daily`,
        "GET",
        await this.getToken()
      );

      if (data.code === 0) {
        this.dailyTx = data.data;
        logger.info(`成功获取每日交易信息: ${JSON.stringify(this.dailyTx)}`);
      } else {
        throw new Error(`无法获取每日交易信息: ${data.message}`);
      }
    } catch (error) {
      this.handleError(error, "获取每日交易信息");
    }
  }

  // 签到
  async checkIn() {
    try {
      logger.info(`尝试签到`);
      await Helper.delay(1000, this.pk, `尝试签到`, this);

      const checkInTxResponse = await this.fetch(
        `/testnet-v1/user/check-in/transaction`,
        "GET",
        await this.getToken()
      );

      if (checkInTxResponse.code === 0) {
        const transactionBuffer = Buffer.from(checkInTxResponse.data.hash, "base64");
        const transaction = Transaction.from(transactionBuffer);

        const tx = await this.doTx(transaction);

        logger.info(`签到交易成功，继续后续签到操作`);
        await Helper.delay(1000, this.pk, `签到交易成功，继续后续签到操作`, this);

        await this.fetch(`/testnet-v1/user/check-in`, "POST", this.token, { hash: tx });

        logger.info(`签到完成`);
      } else if (
        checkInTxResponse.message &&
        checkInTxResponse.message.includes("already checked in")
      ) {
        logger.info(`账户已签到，无需重复操作`);
      } else {
        throw new Error(`签到失败: ${checkInTxResponse.message}`);
      }
    } catch (error) {
      this.handleError(error, "签到");
    }
  }

  // 领取交易里程碑奖励
  async claimTxMilestone(stage) {
    try {
      logger.info(`尝试领取交易里程碑奖励: 阶段 ${stage}`);
      await Helper.delay(DELAY_MS, this.pk, `尝试领取交易里程碑奖励: 阶段 ${stage}`, this);

      const data = await this.fetch(
        `/testnet-v1/user/transactions/rewards/claim`,
        "POST",
        await this.getToken(),
        { stage }
      );

      if (data.code === 0) {
        logger.info(`成功领取阶段 ${stage} 的交易里程碑奖励`);
      } else if (data.message && data.message.includes("already claimed")) {
        logger.info(`阶段 ${stage} 的交易里程碑奖励已领取，跳过操作`);
      } else {
        throw new Error(`领取交易里程碑奖励失败: ${data.message}`);
      }
    } catch (error) {
      this.handleError(error, `领取阶段 ${stage} 的交易里程碑奖励`);
    }
  }

  // 执行交易
  async doTx(transaction) {
    try {
      logger.info(`执行交易 ${JSON.stringify(transaction)}`);
      const tx = await sendAndConfirmTransaction(this.connection, transaction, [
        this.wallet,
      ]);
      logger.info(`交易链接: https://explorer.sonic.game/tx/${tx}`);
      await Helper.delay(DELAY_MS, this.pk, `交易链接: https://explorer.sonic.game/tx/${tx}`, this);
      return tx;
    } catch (error) {
      this.handleError(error, "执行交易");
    }
  }
}

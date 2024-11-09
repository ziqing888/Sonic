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

  // 连接钱包
  async connectWallet() {
    try {
      const privateKeyBuffer = Helper.base58decoder(this.pk);
      /** @type {Keypair} */
      this.wallet = Keypair.fromSecretKey(privateKeyBuffer);
      /** @type {PublicKey} */
      this.address = new PublicKey(this.wallet.publicKey.toBase58());
    } catch (error) {
      throw error;
    }
  }

  // 连接到 Sonic Odyssey
  async connect() {
    logger.info(`连接到 Sonic Odyssey`);
    await this.fetch(
      `/testnet-v1/auth/sonic/challenge?wallet=${this.address}`,
      "GET",
      undefined,
      null,
      "omit"
    )
      .then(async (challangeRes) => {
        const message = challangeRes.data;
        const messageBytes = new TextEncoder().encode(message);
        const signature = nacl.sign.detached(
          messageBytes,
          this.wallet.secretKey
        );
        const signatureBase64 = Buffer.from(signature).toString("base64");
        const addressEncoded = Buffer.from(
          this.wallet.publicKey.toBytes()
        ).toString("base64");
        const requestBody = {
          address: this.address.toBase58(),
          address_encoded: addressEncoded,
          signature: signatureBase64,
        };

        await this.fetch(
          `/testnet-v1/auth/sonic/authorize`,
          "POST",
          undefined,
          requestBody,
          "omit"
        )
          .then(async (authorizeRes) => {
            if (authorizeRes.code == 0) {
              this.token = authorizeRes.data.token;
              logger.info(`成功连接到 Sonic Odyssey`);
              await Helper.delay(
                1000,
                this.pk,
                `已成功连接到 Sonic Odyssey`,
                this
              );
            } else {
              throw new Error(authorizeRes.message);
            }
          })
          .catch((err) => {
            throw err;
          });
      })
      .catch((err) => {
        throw err;
      });
  }

  // 检查余额
  async checkBalance() {
    try {
      this.balance =
        (await this.connection.getBalance(this.address)) / LAMPORTS_PER_SOL;
    } catch (error) {
      throw error;
    }
  }

  /** @param {Transaction} trans */
  // 执行交易
  async doTx(trans) {
    try {
      logger.info(`执行交易 ${JSON.stringify(trans)}`);
      const tx = await sendAndConfirmTransaction(this.connection, trans, [
        this.wallet,
      ]);
      logger.info(`交易链接: https://explorer.sonic.game/tx/${tx}`);
      await Helper.delay(
        1000,
        this.pk,
        `交易链接: https://explorer.sonic.game/tx/${tx}`,
        this
      );
      return tx;
    } catch (error) {
      logger.error(`交易失败: ${error.message}`, error);
      throw error;
    }
  }

  /** @param {Transaction} trans */
  // 执行原始交易
  async doRawTx(trans) {
    try {
      logger.info(`执行原始交易 ${JSON.stringify(trans)}`);
      const rawTransaction = trans.serialize();
      const tx = await this.connection.sendRawTransaction(rawTransaction);
      await this.confirmTx(tx);
      logger.info(`交易链接: https://explorer.sonic.game/tx/${tx}`);
      await Helper.delay(
        1000,
        this.pk,
        `交易链接: https://explorer.sonic.game/tx/${tx}`,
        this
      );
      return tx;
    } catch (error) {
      logger.error(`交易失败: ${error.message}`, error);
      throw error;
    }
  }

  /** @param {Transaction} trans */
  // 确认交易
  async confirmTx(signature) {
    try {
      logger.info(`确认交易中...`);
      await Helper.delay(
        2000,
        this.pk,
        `确认交易中，预计需要 30 秒...`,
        this
      );
      await this.connection.confirmTransaction(signature, "finalized");

      logger.info(`交易已确认`);
      await Helper.delay(2000, this.pk, `交易已确认`, this);
    } catch (error) {
      logger.error(`交易失败: ${error.message}`, error);
      if (this.currentError < Config.maxRetry) {
        this.currentError += 1;
        await Helper.delay(
          2000,
          this.pk,
          `交易在 30 秒后未确认，正在重试...`,
          this
        );
        await this.confirmTx(signature);
      } else {
        this.currentError = 0;
        await Helper.delay(
          2000,
          this.pk,
          `交易未确认且已达到最大重试次数`,
          this
        );
        throw Error("交易未确认且已达到最大重试次数");
      }
    }
  }

  // 向地址发送 Sol
  async sendSolToAddress() {
    try {
      const destAddress =
        Config.destAddress[Helper.random(0, Config.destAddress.length - 1)] ??
        this.address;
      const amount = Config.sendAmount;
      logger.info(`发送 ${amount} 到 ${destAddress}`);
      await Helper.delay(
        1000,
        this.pk,
        `发送 ${amount} 到 ${destAddress}`,
        this
      );
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: this.address,
        toPubkey: destAddress,
        lamports: amount * LAMPORTS_PER_SOL,
      });
      const transaction = new Transaction().add(transferInstruction);
      await this.doTx(transaction)
        .then(async () => {
          await this.checkBalance();
        })
        .catch((err) => {
          throw err;
        });
      this.dailyTx.total_transactions += 1;
    } catch (error) {
      throw error;
    }
  }

  // 签到
  async checkIn() {
    logger.info(`尝试签到`);
    await Helper.delay(1000, this.pk, `尝试签到`, this);
    await this.fetch(
      `/testnet-v1/user/check-in/transaction`,
      "GET",
      this.token,
      null
    )
      .then(async (data) => {
        if (data.code == 0) {
          const transactionBuffer = Buffer.from(data.data.hash, "base64");
          const transaction = Transaction.from(transactionBuffer);

          const tx = await this.doTx(transaction);

          logger.info(
            `签到交易执行成功，继续执行后续签到流程`
          );
          await Helper.delay(
            1000,
            this.pk,
            `签到交易执行成功，继续执行后续签到流程`,
            this
          );
          this.dailyTx.total_transactions += 1;
          await this.postCheckIn(tx);
        } else {
          await Helper.delay(1000, this.pk, data.message, this);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  // 后续签到流程
  async postCheckIn(tx) {
    await Helper.delay(1000, this.pk, `执行后续签到流程`, this);
    await this.fetch(`/testnet-v1/user/check-in`, "POST", this.token, {
      hash: tx,
    })
      .then(async (data) => {
        if (data.code != 0) {
          throw new Error(data.message);
        } else {
          await Helper.delay(1000, this.pk, "签到成功", this);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  // 获取奖励信息
  async getRewardInfo() {
    try {
      await Helper.delay(1000, this.pk, `获取奖励信息`, this);
      await this.fetch("/testnet-v1/user/rewards/info", "GET", this.token)
        .then(async (data) => {
          if (data.code == 0) {
            this.reward = data.data;
            await Helper.delay(
              1000,
              this.pk,
              `成功获取用户奖励信息`,
              this
            );
          } else {
            throw new Error("无法获取用户奖励信息");
          }
        })
        .catch((err) => {
          throw err;
        });
    } catch (error) {
      throw error;
    }
  }

  // 获取每日交易信息
  async getDailyTx() {
    try {
      await Helper.delay(1000, this.pk, `获取每日交易信息`, this);
      await this.fetch(
        `/testnet-v1/user/transactions/state/daily`,
        "GET",
        this.token,
        null
      )
        .then(async (data) => {
          if (data.code != 0) {
            throw new Error(data.message);
          } else {
            this.dailyTx = data.data;
            await Helper.delay(
              1000,
              this.pk,
              `成功获取每日交易信息`,
              this
            );
          }
        })
        .catch((err) => {
          throw err;
        });
    } catch (error) {
      throw error;
    }
  }

  // 领取交易里程碑奖励
  async claimTxMilestone(stage) {
    logger.info(`领取交易里程碑奖励第 ${stage} 阶段`);
    await Helper.delay(
      1000,
      this.pk,
      `领取交易里程碑奖励第 ${stage} 阶段`,
      this
    );
    await this.fetch(
      `/testnet-v1/user/transactions/rewards/claim`,
      "POST",
      this.token,
      {
        stage: stage,
      }
    )
      .then(async (data) => {
        if (data.code == 0) {
          await Helper.delay(1000, this.pk, `领取成功`, this);
        } else {
          await Helper.delay(1000, this.pk, data.message, this);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  // 领取神秘盒子
  async claimMysteryBox() {
    await Helper.delay(
      1000,
      this.pk,
      `生成交易以领取神秘盒子`,
      this
    );
    logger.info(`生成交易以领取神秘盒子`);
    await this.fetch(
      "/testnet-v1/user/rewards/mystery-box/build-tx",
      "GET",
      this.token,
      undefined
    )
      .then(async (data) => {
        if (data.code == 0) {
          const transactionBuffer = Buffer.from(data.data.hash, "base64");
          const transaction = Transaction.from(transactionBuffer);
          transaction.partialSign(this.wallet);
          const tx = await this.doRawTx(transaction);
          await this.openMysteryBox(tx);
        } else {
          await Helper.delay(1000, this.pk, data.message, this);
          logger.error(data.message);
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  // 打开神秘盒子
  async openMysteryBox(hash) {
    await Helper.delay(1000, this.pk, `打开神秘盒子`, this);
    logger.info(`打开神秘盒子`);
    await this.fetch("/user/rewards/mystery-box/open", "POST", this.token, {
      hash: hash,
    })
      .then(async (data) => {
        if (data.code == 0) {
          await Helper.delay(
            3000,
            this.pk,
            `成功打开神秘盒子，获得 ${data.data.amount} RING`,
            this
          );
        } else {
          await Helper.delay(1000, this.pk, data.message, this);
          logger.error(data.message);
        }
      })
      .catch((err) => {
        throw err;
      });
  }
}

import { addressList } from "./address_list.js";

// 配置类
export class Config {
  static sendAmount = 0.0001; // 发送的数量（以 sol 为单位）
  static destAddress = addressList; // 目标地址列表
  static maxRetry = 3; // 领取操作的最大重试次数
}

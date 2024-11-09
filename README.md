# SONIC TX BOT

Sonic Odyssey 机器人 

## 加入我的电报频道

加入我们的频道
[**频道链接**](https://t.me/ksqxszq).

## 机器人功能

- 支持私钥和种子短语
- 支持代理
- 自动签到
- 自动交易（最多100次）
- 自动领取交易里程碑奖励
- 自动打开神秘盒子
- 支持 testnet-v1

## 先决条件

- Git
- Node.js 版本 > 18

## 设置

- 运行 `git clone https://github.com/airdropinsiders/Sonic-Odyssey-Bot.git`
- 运行 `cd Sonic-Odyssey-Bot`
- 运行 `npm install`
- 运行 `cp account_tmp.js account.js && cp proxy_list_tmp.js proxy_list.js` 
- 编辑 `account.js` 文件 `nano account.js`，填入您的账户私钥
- 编辑 `proxy_list.js` 文件 `nano proxy_list.js`，填入您的代理列表
- 运行 `npm run start`

## 配置

可以在 `src/config/config.js` 中进行配置。以下是可配置的变量示例：

```js
export class Config {
  static sendAmount = 0.0001; // 发送的 SOL 数量
  static destAddress = addressList; // 目标地址列表
  static maxRetry = 3; // 领取奖励的最大重试次数
}
```
要配置目标地址列表，请打开 src/config/address_list.js 并调整列表。机器人将从该列表中随机选择目标地址进行发送操作，如果未指定地址，将发送到自己的钱包地址。

如何更新
要更新，只需运行 git pull，如果因未暂存的提交而失败，运行 git stash 然后再运行 git pull。之后执行 npm install 或 npm update。

贡献
欢迎 fork 并贡献新功能，谢谢！

注意
机器人使用 Twister 运行，如果运行多个账户，有些账户的日志可能未显示在终端中，这取决于窗口的大小，但它们仍在运行。您可以在 app.log 文件中查看日志。


import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
function generateResumePosition() {
  const positions = {
    技术职位:
      "java,go,python,rust,C++,后端,前端,全栈,架构师,CTO,SRE,android,安卓,iOS,flutter,cocos,运维,测试,DBA,数据开发,数据分析,区块链开发,合约,solidity,密码学,安全,量化开发,量化策略,",
    非技术职位:
      "市场,运营,增长,CMO,PR,公关,销售,BD,产品,设计,行政,法务,风控,合规,devrel,投资,项目经理,财务,会计,上币,listing",
    "业务-web3":
      "defi,DEX,layer1,layer2,ZK,RPC,钱包,质押,借贷,lending,staking,restaking,支付,AMM,MEV,挖矿,Tokenomics,铭文,meme,法币,C2C,理财,DID,Perp,Perpetual,Indexer,\n" +
      "EVM,NFT,ETH,BTC,solana,TON,波卡,cosmos,ethereum,",
    "业务-AI":
      "AI,AI agent,大模型,大语言模型,AI agent,RAG,生成式AI,多模态,向量数据库,LangChain,智能体",
    "业务-金融":
      "做市,交易,低延迟,套利,回测,订单簿,撮合,滑点,流动性,合约,现货,期权,衍生品,永续,期货,风控,杠杆,量化,网格,外汇,日内,波段,",
  };

  const result: { id: string; category: string; position: string }[] = [];

  Object.entries(positions).forEach(([category, value]) => {
    value
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((position) => {
        result.push({
          id: uuidv4(),
          category,
          position,
        });
      });
  });

  return result;
}

export async function GET() {
  return NextResponse.json(generateResumePosition());
}

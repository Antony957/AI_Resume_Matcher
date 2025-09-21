import json
from typing import Optional, Dict, Any
import numpy as np

from utils.openai_client_manager import OpenAIClientManager
from utils.sentence_model_manager import SentenceModelManager
from utils.logger import setup_logger

logger = setup_logger("resume_processor")


def lowercase_json(obj):
    if isinstance(obj, dict):
        return {k: lowercase_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [lowercase_json(item) for item in obj]
    elif isinstance(obj, str):
        return obj.lower()
    else:
        return obj


class ResumeProcessor:
    def __init__(self):
        self.client = OpenAIClientManager.get_client()
        self.sentence_model = SentenceModelManager.get_model()

        self.schema = {
            "type": "object",
            "strict": True,
            "properties": {
                "category": {
                    "type": "string",
                },
                "category_skills": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "market": {
                    "type": "string",
                },
                "market_field": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "education": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "title": {
                    "type": "string"
                },
                "skills": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "others": {
                    "type": "array",
                    "items": {"type": "string"}
                },
            },
            "additionalProperties": False,
            "required": ["category", "category_skills", "market", "market_field", "education", "title","skills", "others"]
        }


    def semantic_resume_match(self, json_content) -> Optional[Dict[str, Any]]:
        json_content = lowercase_json(json_content)
        """用小模型匹配和筛选固定领域的token"""
        # 技术类别：技术类/非技术类
        category_corpus = ["技术类", "非技术类"]
        content_category = json_content['category']
        category_embeddings = self.sentence_model.encode(category_corpus, convert_to_tensor=False, normalize_embeddings=True)
        query_embedding = self.sentence_model.encode(content_category, convert_to_tensor=False, normalize_embeddings=True)
        cos_sim = np.dot(category_embeddings, query_embedding)  # shape: [N]
        top_idx = np.argmax(cos_sim)
        json_content['category'] = category_corpus[top_idx]

        category_skill_corpus = []
        if json_content['category'] == "技术类":
            category_skill_corpus = ["java", "go", "python", "rust", "c++", "后端", "前端", "全栈", "架构师", "cto", "sre", "android", "ios", "flutter", "cocos", "运维", "测试", "dba", "数据开发", "数据分析", "区块链开发", "合约", "solidity", "密码学", "安全", "量化开发", "量化策略"]
        elif json_content['category'] == "非技术类":
            category_skill_corpus = ["市场", "运营", "增长", "cmo", "pr", "公关", "销售", "bd", "产品", "设计", "行政", "法务", "风控", "合规", "devrel", "投资", "项目经理", "财务", "会计", "上币", "listing"]
        category_skill_tag = set()
        category_skill_embeddings = self.sentence_model.encode(category_skill_corpus, convert_to_tensor=False, normalize_embeddings=True)
        for item in json_content["category_skills"]:
            query_embedding = self.sentence_model.encode(item, convert_to_tensor=False, normalize_embeddings=True)
            cos_sim = np.dot(category_skill_embeddings, query_embedding)  # shape: [N]
            top_idx = np.argmax(cos_sim)
            if cos_sim[top_idx] > 0.8:
                category_skill_tag.add(category_skill_corpus[top_idx])
        json_content["category_skills"] = list(category_skill_tag)

        # 业务场景：web3, AI, 金融
        market_corpus = ["web3", "AI", "金融"]
        content_market = json_content['market']
        market_embeddings = self.sentence_model.encode(market_corpus, convert_to_tensor=False, normalize_embeddings=True)
        query_embedding = self.sentence_model.encode(content_market, convert_to_tensor=False, normalize_embeddings=True)
        cos_sim = np.dot(market_embeddings, query_embedding)  # shape: [N]
        top_idx = np.argmax(cos_sim)
        json_content['market'] = market_corpus[top_idx]

        market_field_corpus = []
        if json_content['market'] == "web3":
            market_field_corpus = ["defi", "dex", "layer1", "layer2", "zk", "rpc", "钱包", "质押", "借贷", "lending", "staking", "restaking", "支付", "amm", "mev", "挖矿", "tokenomics", "铭文", "meme", "法币", "c2c", "理财", "did", "perp", "perpetual", "indexer", "evm", "nft", "eth", "btc", "solana", "ton", "波卡", "cosmos", "ethereum", "流动性"]
        elif json_content['market'] == "AI":
            market_field_corpus = ["ai", "ai agent", "大模型", "大语言模型", "rag", "生成式ai", "多模态", "向量数据库", "langchain", "智能体"]
        elif json_content['market'] == "金融":
            market_field_corpus = ["做市", "交易", "低延迟", "套利", "回测", "订单簿", "撮合", "滑点", "流动性", "合约", "现货", "期权", "衍生品", "永续", "期货", "风控", "杠杆", "量化", "网格", "外汇", "日内", "波段"]
        market_field_tag = set()
        market_field_embeddings = self.sentence_model.encode(market_field_corpus, convert_to_tensor=False, normalize_embeddings=True)
        for item in json_content["market_field"]:
            query_embedding = self.sentence_model.encode(item, convert_to_tensor=False, normalize_embeddings=True)
            cos_sim = np.dot(market_field_embeddings, query_embedding)  # shape: [N]
            top_idx = np.argmax(cos_sim)
            if cos_sim[top_idx] > 0.8:
                market_field_tag.add(market_field_corpus[top_idx])
        json_content["market_field"] = list(market_field_tag)


        # 教育标签：985高校，211高校，本科，硕士，博士，海外学历，QS50, 清北，QS100，专科，专升本
        education_corpus = ["985高校", "211高校", "本科", "硕士", "博士", "海外学历", "qs50", "清北", "qs100", "专科", "专升本"]
        education_embeddings = self.sentence_model.encode(education_corpus, convert_to_tensor=False, normalize_embeddings=True)
        education_tag = set()
        for item in json_content["education"]:
            query_embedding = self.sentence_model.encode(item, convert_to_tensor=False, normalize_embeddings=True)
            cos_sim = np.dot(education_embeddings, query_embedding)  # shape: [N]
            top_idx = np.argmax(cos_sim)
            if cos_sim[top_idx] > 0.8:
                education_tag.add(education_corpus[top_idx])
        json_content["education"] = list(education_tag)
        return json_content


    def parse_resume_content(self, json_content: str) -> Optional[Dict[str, Any]]:
        """解析简历内容为结构化数据"""
        try:
            print(f"开始调用OpenAI API提取简历标签...")
            print(f"输入数据类型: {type(json_content)}")
            print(f"输入数据长度: {len(str(json_content))}")
            
            # 确保输入是字符串格式
            content_str = json.dumps(json_content) if isinstance(json_content, dict) else str(json_content)
            print(f"转换后内容长度: {len(content_str)}")
            
            # 调用OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """下面是一份转换为json格式的简历，请你帮助我提取其中的关键字标签。json字段包括：
category, 分为技术类/非技术类。
如果为技术类，category_skills主要包括java, go, python, rust, C++, 后端, 前端, 全栈, 架构师, CTO, SRE, android, iOS, flutter, cocos, 运维, 测试, DBA, 数据开发, 数据分析, 区块链开发, 合约, solidity, 密码学, 安全, 量化开发, 量化策略等, 
如果为非技术类，category_skills主要包括java主要包括市场, 运营, 增长, CMO, PR, 公关, 销售, BD, 产品, 设计, 行政, 法务, 风控, 合规, devrel, 投资, 项目经理, 财务, 会计, 上币, listing等。
market, 主要包括web3, AI, 金融。
market_field，表示用户在市场中的细分工作，
如果属于web3，主要包括defi, DEX, layer1, layer2, ZK, RPC, 钱包, 质押, 借贷, lending, staking, restaking, 支付, AMM, MEV, 挖矿, Tokenomics, 铭文, meme, 法币, C2C, 理财, DID, Perp, Perpetual, Indexer, 
EVM, NFT, ETH, BTC, solana, TON, 波卡, cosmos, ethereum。
如果属于AI，主要包括AI, AI agent, 大模型, 大语言模型, RAG, 生成式AI, 多模态, 向量数据库, LangChain, 智能体。
如果属于金融，主要包括做市, 交易, 低延迟, 套利, 回测, 订单簿, 撮合, 滑点, 流动性, 合约, 现货, 期权, 衍生品, 永续, 期货, 风控, 杠杆, 量化, 网格, 外汇, 日内, 波段, 
title, 表示用户目前的职位。 
education, 表示用户的学历。常用标签为：985高校，211高校，本科，硕士，博士，海外学历，QS50, 清北，QS100，专科，专升本, 
skills, 表示用户所掌握的技能栈和认证。
others. 
如果某一个字段为空，请返回空列表。
示例1：
{
"category": "技术类",
"category_skills: ["java", "go", "python", "rust", "C++", "后端", "前端", "全栈", '架构师', "CTO", "SRE"] "
"market": "web3",
"market_field: ["defi", "DEX", "layer1", "layer2", "ZK", "RPC", "钱包", "质押", "借贷", "lending", "staking"]"
"title": "资深Java工程师", 
"education": ["211高校", "本科", "硕士","985高校"],
"skills":["SpringBoot", "Kafka", "Etcd", "Docker", "Netty"], 
"others": ["日语N2", "足球"]
}
"""
                    },
                    {"role": "user", "content": content_str}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "ai_resume",
                        "schema": self.schema
                    }
                }
            )

            print("OpenAI API调用成功，开始解析响应...")
            
            # 获取JSON响应
            json_result = response.choices[0].message.content
            print(f"API返回内容长度: {len(json_result) if json_result else 0}")
            print(f"API返回内容前200字符: {json_result[:200] if json_result else 'Empty'}")
            
            # 解析JSON
            parsed_json = json.loads(json_result)
            print(f"JSON解析成功，开始语义对齐...")

            # 对齐标签
            parsed_json = self.semantic_resume_match(parsed_json)
            print(f"语义对齐完成，最终结果keys: {list(parsed_json.keys()) if parsed_json else 'None'}")
            # logger.info("LLM解析成功")
            # logger.debug(f"解析结果预览: {str(parsed_json)[:200]}...")

            return parsed_json

        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            print(f"原始响应内容: {json_result if 'json_result' in locals() else 'API响应为空'}")
            return None
        except Exception as e:
            print(f"LLM解析失败: {e}")
            import traceback
            traceback.print_exc()
            return None

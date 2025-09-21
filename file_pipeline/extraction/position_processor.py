import json
from typing import Optional, Dict, Any
import numpy as np
from utils.openai_client_manager import OpenAIClientManager
from utils.sentence_model_manager import SentenceModelManager


# logger = setup_logger("llm_processor")


def lowercase_json(obj):
    if isinstance(obj, dict):
        return {k: lowercase_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [lowercase_json(item) for item in obj]
    elif isinstance(obj, str):
        return obj.lower()
    else:
        return obj

class PositionProcessor:
    """LLM解析处理器"""
    def __init__(self):
        self.client = OpenAIClientManager.get_client()
        self.sentence_model = SentenceModelManager.get_model()
    # JSON Schema定义
        self.polish_schema = {
            "type": "object",
            "strict": True,
            "properties": {
                "content": {"type": "string"},
            },
            "additionalProperties": False,
            "required": ["content"]
        }
        self.tag_schema = {
            "type": "object",
            "strict": True,
            "properties": {
                "category": {"type": "string"},
                "market": {"type": "string"},
                "market_field":{
                    "type": "object",
                    "strict": True,
                    "properties": {
                        "required": {"type": "array", "items": {"type": "string"}},
                        "recommended": {"type": "array", "items": {"type": "string"}},
                        "exclude": {"type": "array", "items": {"type": "string"}},
                    }
                },
                "education":{
                    "type": "object",
                    "strict": True,
                    "properties": {
                        "required": {"type": "array", "items": {"type": "string"}},
                        "recommended": {"type": "array", "items": {"type": "string"}},
                        "exclude": {"type": "array", "items": {"type": "string"}},
                    }
                },
                "work_experience": {
                    "type": "object",
                    "strict": True,
                    "properties": {
                        "required": {"type": "array", "items": {"type": "string"}},
                        "recommended": {"type": "array", "items": {"type": "string"}},
                        "exclude": {"type": "array", "items": {"type": "string"}},
                    }
                },
                "others": {
                    "type": "object",
                    "strict": True,
                    "properties": {
                        "required": {"type": "array", "items": {"type": "string"}},
                        "recommended": {"type": "array", "items": {"type": "string"}},
                        "exclude": {"type": "array", "items": {"type": "string"}},
                    }
                },
            },
            "additionalProperties": False,
            "required": ["category", "market", "market_field","education", "work_experience", "others"]
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

        market_field_embeddings = self.sentence_model.encode(market_field_corpus, convert_to_tensor=False, normalize_embeddings=True)
        for item in json_content["market_field"]:
            market_field_tag = set()
            for i in json_content["market_field"][item]:
                query_embedding = self.sentence_model.encode(i, convert_to_tensor=False, normalize_embeddings=True)
                cos_sim = np.dot(market_field_embeddings, query_embedding)  # shape: [N]
                top_idx = np.argmax(cos_sim)
                if cos_sim[top_idx] > 0.8:
                    market_field_tag.add(market_field_corpus[top_idx])
            json_content["market_field"][item] = list(market_field_tag)


        # 教育标签：985高校，211高校，本科，硕士，博士，海外学历，QS50, 清北，QS100，专科，专升本
        education_corpus = ["985高校", "211高校", "本科", "硕士", "博士", "海外学历", "qs50", "清北", "qs100", "专科", "专升本"]
        education_embeddings = self.sentence_model.encode(education_corpus, convert_to_tensor=False, normalize_embeddings=True)

        for item in json_content["education"]:
            education_tag = set()
            for i in json_content["education"][item]:
                query_embedding = self.sentence_model.encode(i, convert_to_tensor=False, normalize_embeddings=True)
                cos_sim = np.dot(education_embeddings, query_embedding)  # shape: [N]
                top_idx = np.argmax(cos_sim)
                if cos_sim[top_idx] > 0.8:
                    education_tag.add(education_corpus[top_idx])
            json_content["education"][item] = list(education_tag)
        return json_content


    def polish_position_content(self, input_content):
        try:
            print(f"开始润色职位内容，输入长度: {len(str(input_content))}")
            
            # 确保输入是字符串格式
            content_str = str(input_content)
            print(f"转换后内容: {content_str[:200]}...")
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """下面是一段招聘要求的文字，请你将其转化为通顺的语句。同时，对于招聘要求中没有明确说明的的技能要求和从事的行业要求，请你根据上下文判断做出相应的文字补充。如果简历内容全部为英语，也请翻译为以中文为主，英语为辅的表达方式。输出为json。"""
                    },
                    {"role": "user", "content": content_str}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "ai_resume",
                        "schema": self.polish_schema
                    }
                }
            )

            print("OpenAI API调用成功，开始解析响应...")
            
            # 获取JSON响应
            json_result = response.choices[0].message.content
            print(f"API返回内容长度: {len(json_result) if json_result else 0}")
            print(f"API返回内容前200字符: {json_result[:200] if json_result else 'Empty'}")
            
            parsed_json = json.loads(json_result)
            polished_content = parsed_json['content']
            
            print(f"润色完成，结果长度: {len(polished_content)}")
            return polished_content

        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            print(f"原始响应内容: {json_result if 'json_result' in locals() else 'API响应为空'}")
            return None
        except Exception as e:
            print(f"润色职位内容失败: {e}")
            import traceback
            traceback.print_exc()
            return None

    def parse_resume_content(self, input_content: str) -> Optional[Dict[str, Any]]:
        """解析简历内容为结构化数据"""
        try:
            print(f"开始调用OpenAI API提取职位标签...")
            print(f"输入数据类型: {type(input_content)}")
            print(f"输入数据长度: {len(str(input_content))}")
            
            # 确保输入是字符串格式
            content_str = str(input_content)
            print(f"转换后内容长度: {len(content_str)}")
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """下面是一段招聘要求的文字，请你识别出在行业、工作内容、工作要求的信息之后转化为json。json字段包括：
                        category, 分为技术类/非技术类。
market, 主要包括web3, AI, 金融。
market_field，表示用户在市场中的细分工作，
如果属于web3，主要包括defi, DEX, layer1, layer2, ZK, RPC, 钱包, 质押, 借贷, lending, staking, restaking, 支付, AMM, MEV, 挖矿, Tokenomics, 铭文, meme, 法币, C2C, 理财, DID, Perp, Perpetual, Indexer, 
EVM, NFT, ETH, BTC, solana, TON, 波卡, cosmos, ethereum。
如果属于AI，主要包括AI, AI agent, 大模型, 大语言模型, RAG, 生成式AI, 多模态, 向量数据库, LangChain, 智能体。
如果属于金融，主要包括做市, 交易, 低延迟, 套利, 回测, 订单簿, 撮合, 滑点, 流动性, 合约, 现货, 期权, 衍生品, 永续, 期货, 风控, 杠杆, 量化, 网格, 外汇, 日内, 波段, 
education, 表示用户的学历。常用标签为：985高校，211高校，本科，硕士，博士，海外学历，QS50, 清北，QS100，专科，专升本, 
others.
除category和market之外，每个字段包括required，recommended，exclude三个字段，分别表示雇主所必须的标签，偏好的标签，和不应该有的标签。
如果某一个字段为空，请返回空列表。
示例1:
{
  "category": "技术类",
  "market": "web3",
  "market_field": {
    "required": ["layer1", "layer2"],
    "recommended": ["RPC"],
    "exclude": []
  },
  "education": {
    "required": ["本科", "硕士"],
    "recommended": [],
    "exclude": []
  },
  "others": {
    "required": ["远程工作经验", "异步工作经验"],
    "recommended": [],
    "exclude": []
  }
}
                        """
                    },
                    {"role": "user", "content": content_str}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "ai_resume",
                        "schema": self.tag_schema
                    }
                }
            )
            
            print("OpenAI API调用成功，开始解析响应...")
            
            json_result = response.choices[0].message.content
            print(f"API返回内容长度: {len(json_result) if json_result else 0}")
            print(f"API返回内容前200字符: {json_result[:200] if json_result else 'Empty'}")

            # 解析JSON
            parsed_json = json.loads(json_result)
            print("parsed_json", parsed_json)

            parsed_tag = self.semantic_resume_match(parsed_json)

            print("parsed_tag", parsed_tag)
            print(f"语义对齐完成，最终结果keys: {list(parsed_tag.keys()) if parsed_tag else 'None'}")
            return parsed_tag
        
        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            print(f"原始响应内容: {json_result if 'json_result' in locals() else 'API响应为空'}")
            return None
        except Exception as e:
            print(f"LLM职位解析失败: {e}")
            import traceback
            traceback.print_exc()
            return None


if __name__ == '__main__':
    processor = PositionProcessor()
    processor.parse_resume_content("""需要人选对目前市面上的 defi 协议比较精通，有过一些 AI 相关的知识
更多的还是在 WEB3 上面的经验，更垂直在defi 领域
最好是在defi领域有过一些成功项目的，如果人选对defi了解的很深入，经验比较多，不了解AI方面知识也可以
需要人选对目前市面上的 defi 协议比较精通，有过一些 AI 相关的知识
更多的还是在 WEB3 上面的经验，更垂直在defi 领域
最好是在defi领域有过一些成功项目的，如果人选对defi了解的很深入，经验比较多，不了解AI方面知识也可以
"""
)
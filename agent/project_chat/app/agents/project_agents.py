from agents.project_extract_agent.prompts import PROJECT_EXTRACT_INPUT_PROMPT, PROJECT_EXTRACT_SYSTEM_PROMPT
from tools.project_search import ProjectSearchTool
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from langchain_anthropic import ChatAnthropic
from core.logging import get_logger

logger = get_logger("project_extract_agent")


class ProjectAgent:
    def __init__(self, client: ChatAnthropic):
        """シンプルなLLMチェーンベースのエージェントを初期化"""
        self.llm = client
        self.search_tool = ProjectSearchTool()
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", PROJECT_EXTRACT_SYSTEM_PROMPT),
            ("user", "{input}")
        ])
        self.chain = (
            {"input": RunnablePassthrough()}
            | self.prompt
            | self.llm
            | StrOutputParser()
        )

    def run(self, state: dict):
        try:
            project = state["project"].to_summary()
            chat_history = [chat.to_summary() for chat in state["chat_history"]]
            input_text = state["input_text"]
            formatted_input = PROJECT_EXTRACT_INPUT_PROMPT.format(
                project=project,
                question=input_text,
                chat_history=chat_history
            )
            response = self.chain.invoke(formatted_input)
            return {"output_text": response}
        except Exception as e:
            error_msg = f"プロジェクト情報の処理中にエラーが発生しました: {str(e)}"
            logger.error(f"ProjectAgent error: {error_msg}")
            return {"output_text": f"申し訳ございません。{error_msg}"}



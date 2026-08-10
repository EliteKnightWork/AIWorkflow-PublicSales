from typing import Optional, TypedDict

from pydantic import Field
from agents.project_agents import ProjectAgent
from langgraph.graph import START, StateGraph
from models.project import Project
from langchain_anthropic import ChatAnthropic
from models.project_chat import ProjectChat
from repository.project_repository import ProjectRepository
from core.config import get_llm_config
from core.exceptions import LLMError, ConfigurationError, ProjectNotFoundError
from core.logging import get_logger

logger = get_logger("chat_agent")
class ChatAgentState(TypedDict):
    uuid: str
    project: Project = Field(description="入札案件の情報")
    input_text: str
    chat_history: list[ProjectChat]
    output_text: str
    plan_route: int

class ChatAgent:
    """チャットエージェントクラス"""
    def __init__(self, stream: bool = False):
        try:
            llm_config = get_llm_config()
            logger.info("Initializing ChatAgent", extra={
                "model": llm_config.anthropic_model,
                "max_tokens": llm_config.max_tokens,
                "temperature": llm_config.temperature,
                "streaming": stream
            })
            
            client = ChatAnthropic(
                model=llm_config.anthropic_model, 
                max_tokens=llm_config.max_tokens, 
                streaming=stream,
                temperature=llm_config.temperature
            )
            self.llm = client
            self.project_extraction_agent = ProjectAgent(client)
            
            logger.info("ChatAgent initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize ChatAgent: {str(e)}")
            raise LLMError(
                f"Failed to initialize LLM client: {str(e)}",
                error_code="LLM_INITIALIZATION_ERROR"
            )
        
    def chat(self, uuid: str, input_text: str, chat_history: list[ProjectChat], project: Optional[Project] = None):
        """プロジェクトのチャット処理を実行"""
        try:
            logger.info(f"Starting chat for project {uuid}", extra={
                "input_length": len(input_text),
                "chat_history_length": len(chat_history),
                "has_project": project is not None
            })

            app = StateGraph(ChatAgentState).add_node("project_extraction", self.project_extraction_agent.run).add_edge(START, "project_extraction").compile()

            if project is None:
                repository = ProjectRepository()
                project = repository.get_project_by_uuid(uuid)
                if project is None:
                    logger.warning(f"Project not found for uuid: {uuid}")
                    raise ProjectNotFoundError(f"Project not found for uuid: {uuid}")

            logger.info(f"Starting chat stream for project {uuid}")
            result = app.stream(
                {"uuid": uuid, "input_text": input_text, "chat_history": chat_history, "project": project},
                stream_mode="messages",
            )
            
            logger.info(f"Chat stream started successfully for project {uuid}")
            return result
            
        except ProjectNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error in chat method for project {uuid}: {str(e)}")
            raise LLMError(
                f"Chat processing failed: {str(e)}",
                error_code="CHAT_PROCESSING_ERROR"
            )



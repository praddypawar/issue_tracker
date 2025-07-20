import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import markdown
import bleach
from app.config import settings


class AIDescriptionEnhancer:
    """
    Transform rough issue descriptions into professional, structured format
    Must include:
    - Issue summary
    - Problem description
    - Steps to reproduce
    - Expected vs actual behavior
    - Priority justification
    - Markdown formatting
    """

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.2,
        )
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Rewrite the following issue description to be clear, concise, and professional. If there are multiple items, present them as a bullet-pointed list in markdown. Do not invent details or add boilerplate. Only clarify and improve the wording.",
                ),
                ("user", "{description}"),
            ]
        )
        self.chain = self.prompt | self.llm | StrOutputParser()

    async def enhance_description(self, description: str) -> dict:
        enhanced_text = await self.chain.ainvoke({"description": description})
        # Convert markdown to HTML and sanitize
        markdown_html = bleach.clean(
            markdown.markdown(enhanced_text),
            tags=list(bleach.sanitizer.ALLOWED_TAGS)
            + ["p", "ul", "ol", "li", "strong", "em", "h1", "h2", "h3", "pre", "code"],
            strip=True,
        )
        return {
            "enhanced_text": enhanced_text,
            "markdown_html": markdown_html,
            "original": description,
        }

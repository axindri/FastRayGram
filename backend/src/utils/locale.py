from src.core.enums import LangCodes


def get_locale_text(en_content: str, ru_content: str) -> dict[LangCodes, str]:
    return {
        LangCodes.EN: en_content,
        LangCodes.RU: ru_content,
    }

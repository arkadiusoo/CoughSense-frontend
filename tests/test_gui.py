from pathlib import Path

from pages.home_page import HomePage

AUDIO_PATH = Path(__file__).resolve().parent / "assets" / "sample.wav"
LANGUAGE_KEY = "coughsense.language"
THEME_KEY = "coughsense.theme"
PL_TITLE = "Sprawdź kaszel lub oddech"


def test_tc_gui_01_language_change(driver, base_url):
    page = HomePage(driver, base_url)
    page.open(clean_storage=True)
    page.set_local_storage(LANGUAGE_KEY, "pl")
    page.reload()

    assert page.get_app_title() == PL_TITLE

    page.select_language("en")
    page.wait_language_active("en")

    assert page.get_document_lang() == "en"
    assert page.get_app_title() != PL_TITLE


def test_tc_gui_02_theme_change(driver, base_url):
    page = HomePage(driver, base_url)
    page.open(clean_storage=True)
    page.set_local_storage(THEME_KEY, "light")
    page.reload()

    initial_theme = page.get_theme()
    page.toggle_theme()
    page.wait_for_theme_change(initial_theme)

    assert page.get_theme() != initial_theme


def test_tc_gui_03_history_handling(driver, base_url):
    assert AUDIO_PATH.is_file(), f"Missing audio test file: {AUDIO_PATH}"

    page = HomePage(driver, base_url)
    page.open(clean_storage=True)
    page.set_local_storage(LANGUAGE_KEY, "en")
    page.set_local_storage(THEME_KEY, "light")
    page.reload()

    result_text = page.analyze_file(AUDIO_PATH)
    assert result_text.strip() != ""

    page.open_history_panel()
    items = page.wait_for_history_items()

    assert len(items) > 0


def test_tc_gui_04_audio_analysis(driver, base_url):
    assert AUDIO_PATH.is_file(), f"Missing audio test file: {AUDIO_PATH}"

    page = HomePage(driver, base_url)
    page.open(clean_storage=True)
    page.set_local_storage(LANGUAGE_KEY, "en")
    page.set_local_storage(THEME_KEY, "light")
    page.reload()

    result_text = page.analyze_file(AUDIO_PATH)

    assert result_text.strip() != ""

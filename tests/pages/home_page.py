from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from pages.base_page import BasePage


class HomePage(BasePage):
    LANG_TEST_IDS = {
        "en": "lang-en",
        "pl": "lang-pl",
        "es": "lang-es",
        "de": "lang-de",
    }

    def open(self, clean_storage=False):
        super().open()
        if clean_storage:
            self.clear_storage()
            self.reload()

    def select_language(self, language_code):
        test_id = self.LANG_TEST_IDS[language_code]
        self.click_by_test_id(test_id)

    def wait_language_active(self, language_code):
        test_id = self.LANG_TEST_IDS[language_code]
        locator = (By.CSS_SELECTOR, f'[data-testid="{test_id}"]')
        self.wait.until(
            lambda d: d.find_element(*locator).get_attribute("aria-pressed") == "true"
        )

    def get_app_title(self):
        return self.find_by_test_id("app-title").text

    def get_document_lang(self):
        return self.driver.execute_script("return document.documentElement.lang;")

    def toggle_theme(self):
        self.click_by_test_id("theme-toggle")

    def get_theme(self):
        return self.driver.execute_script(
            "return document.documentElement.dataset.theme;"
        )

    def wait_for_theme_change(self, previous_theme):
        self.wait.until(lambda d: self.get_theme() != previous_theme)

    def upload_audio(self, file_path):
        input_el = self.find_present_by_test_id("audio-input")
        input_el.send_keys(str(file_path))

    def wait_for_analyze_enabled(self):
        locator = (By.CSS_SELECTOR, '[data-testid="analyze-button"]')
        self.wait.until(
            lambda d: d.find_element(*locator).get_attribute("disabled") is None
        )

    def start_analysis(self):
        self.click_by_test_id("analyze-button")

    def confirm_disclaimer(self):
        self.find_by_test_id("disclaimer-modal")
        self.click_by_test_id("disclaimer-confirm")

    def wait_for_result_text(self, timeout=30):
        result_wait = WebDriverWait(self.driver, timeout)
        locator = (By.CSS_SELECTOR, '[data-testid="analysis-result"]')
        result_wait.until(EC.visibility_of_element_located(locator))
        result_wait.until(
            lambda d: d.find_element(*locator).text.strip() != ""
        )
        return self.driver.find_element(*locator).text

    def analyze_file(self, file_path, timeout=30):
        self.upload_audio(file_path)
        self.wait_for_analyze_enabled()
        self.start_analysis()
        self.confirm_disclaimer()
        return self.wait_for_result_text(timeout=timeout)

    def open_history_panel(self):
        self.click_by_test_id("toggle-history")
        panel_locator = (By.CSS_SELECTOR, '[data-testid="history-panel"]')
        self.wait.until(
            lambda d: d.find_element(*panel_locator).get_attribute("aria-hidden")
            == "false"
        )

    def wait_for_history_items(self):
        list_locator = (By.CSS_SELECTOR, '[data-testid="history-list"]')
        self.wait.until(EC.visibility_of_element_located(list_locator))
        items_locator = (By.CSS_SELECTOR, '[data-testid="history-item"]')
        self.wait.until(lambda d: len(d.find_elements(*items_locator)) > 0)
        return self.driver.find_elements(*items_locator)

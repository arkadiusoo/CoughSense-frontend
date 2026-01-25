from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class BasePage:
    def __init__(self, driver, base_url, timeout=10):
        self.driver = driver
        self.base_url = base_url.rstrip("/")
        self.wait = WebDriverWait(driver, timeout)

    def open(self, path=""):
        url = f"{self.base_url}/{path.lstrip('/')}" if path else self.base_url
        self.driver.get(url)

    def reload(self):
        self.driver.refresh()

    def clear_storage(self):
        self.driver.execute_script(
            "window.localStorage.clear(); window.sessionStorage.clear();"
        )

    def set_local_storage(self, key, value):
        self.driver.execute_script(
            "window.localStorage.setItem(arguments[0], arguments[1]);", key, value
        )

    def set_session_storage(self, key, value):
        self.driver.execute_script(
            "window.sessionStorage.setItem(arguments[0], arguments[1]);", key, value
        )

    def find_by_test_id(self, test_id):
        locator = (By.CSS_SELECTOR, f'[data-testid="{test_id}"]')
        return self.wait.until(EC.visibility_of_element_located(locator))

    def find_present_by_test_id(self, test_id):
        locator = (By.CSS_SELECTOR, f'[data-testid="{test_id}"]')
        return self.wait.until(EC.presence_of_element_located(locator))

    def click_by_test_id(self, test_id):
        locator = (By.CSS_SELECTOR, f'[data-testid="{test_id}"]')
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()
        return element

    def find_all_by_test_id(self, test_id):
        return self.driver.find_elements(By.CSS_SELECTOR, f'[data-testid="{test_id}"]')

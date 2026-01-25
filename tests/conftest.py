import os

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions


def _build_driver():
    browser = os.getenv("BROWSER", "chrome").lower()
    headless = os.getenv("HEADLESS", "1") == "1"

    if browser == "firefox":
        options = FirefoxOptions()
        if headless:
            options.add_argument("-headless")
        driver = webdriver.Firefox(options=options)
    else:
        options = ChromeOptions()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--window-size=1400,900")
        options.add_argument("--disable-gpu")
        driver = webdriver.Chrome(options=options)

    driver.implicitly_wait(0)
    return driver


@pytest.fixture
def base_url():
    return os.getenv("BASE_URL", "http://localhost:5173")


@pytest.fixture
def driver():
    driver = _build_driver()
    keep_open = os.getenv("KEEP_BROWSER_OPEN", "0") == "1"
    yield driver
    if keep_open:
        try:
            input("KEEP_BROWSER_OPEN=1 set. Press Enter to close the browser...")
        except EOFError:
            pass
    driver.quit()

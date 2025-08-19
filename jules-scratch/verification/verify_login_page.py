from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the login page
        page.goto("http://localhost:3000/auth/login")

        # Wait for the page to load and check for a key element
        expect(page.get_by_role("heading", name="Login")).to_be_visible()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/login-page.png")

        print("Screenshot of the login page taken successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

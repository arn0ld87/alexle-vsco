from playwright.sync_api import sync_playwright, expect
import re

def run_verification(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    base_url = "http://localhost:4321"

    # 1. Homepage Screenshot (in dark mode)
    page.goto(base_url)
    # Click toggle to ensure dark mode is active and icons are correct
    page.locator('#theme-toggle').click()
    expect(page.locator('html')).to_have_class(re.compile("dark"))
    page.screenshot(path="jules-scratch/verification/homepage.png")

    # 2. Game Screenshot (HUD + Hit)
    page.goto(f"{base_url}/demos/space-shooter-game/")
    page.get_by_role('button', name='SPIEL STARTEN').click()
    expect(page.get_by_role('heading', name='Wähle deinen Charakter')).to_be_visible()
    page.get_by_role('img', name='Alex').click()
    expect(page.locator('#app canvas')).to_be_visible()

    # Wait for game to be ready, then deterministically spawn an enemy and fire
    page.wait_for_function("window.gameInstance && typeof window.gameInstance._spawnEnemyAt === 'function'", timeout=10000)
    page.evaluate("window.gameInstance._spawnEnemyAt(0, -10)") # Spawn enemy in front of player
    page.evaluate("window.gameInstance._getGame().fireBullet()")

    # Wait for the score to update
    page.wait_for_function("window.gameInstance && window.gameInstance._getGame().state.score > 0", timeout=5000)
    page.screenshot(path="jules-scratch/verification/game_hit.png")

    # 3. Contact Form Screenshots
    page.goto(f"{base_url}/kontakt")

    # Success case
    page.locator('#name').fill('Test User')
    page.locator('#email').fill('test@example.com')
    page.locator('#message').fill('This is a test message.')
    page.route('https://formspree.io/f/mnqennra', lambda route: route.fulfill(status=200, json={'ok': True}))
    page.get_by_role('button', name='Nachricht senden').click()
    expect(page.locator('#form-feedback')).to_have_text(re.compile("Vielen Dank"))
    page.screenshot(path="jules-scratch/verification/contact_success.png")

    # Error case
    page.reload()
    page.get_by_role('button', name='Nachricht senden').click()
    expect(page.locator('#form-feedback')).to_have_text(re.compile("alle Felder aus"))
    page.screenshot(path="jules-scratch/verification/contact_error.png")

    browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
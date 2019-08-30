/** @typedef {import('./node_modules/lighthouse/types/lhr')} LH */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const server = require('./server/server.js');

const DEBUG_PORT = 8042;
const SERVER_PORT = 8000;

jest.setTimeout(30000);

/**
 * @param {string} url
 * @return {Promise<LH.Result>}
 */
async function runLighthouse(url) {
  const result = await lighthouse(url, {port: DEBUG_PORT});
  return result.lhr;
}

describe('my site', () => {
  /** @type {import('puppeteer').Browser} */
  let browser;
  /** @type {import('puppeteer').Page} */
  let page;

  beforeAll(async () => {
    server.listen(SERVER_PORT);
    browser = await puppeteer.launch({
      args: [`--remote-debugging-port=${DEBUG_PORT}`],
      headless: !process.env.DEBUG,
      slowMo: process.env.DEBUG ? 50 : undefined,
    });
  });

  afterAll(async () => {
    await browser.close();
    server.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  describe('logged out', () => {
    describe('homepage', () => {
      beforeEach(async () => {
        await page.goto('http://localhost:8000/');
      });

      it('lighthouse', async () => {
        const lhr = await runLighthouse(page.url());
        expect(lhr.categories.seo.score).toBeGreaterThanOrEqual(0.9);
      });

      it('login form should exist', async () => {
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');
        expect(emailInput).toBeTruthy();
        expect(passwordInput).toBeTruthy();
      });
    });

    describe('dashboard', () => {
      beforeEach(async () => {
        await page.goto('http://localhost:8000/');
      });

      it('lighthouse', async () => {
        const lhr = await runLighthouse(page.url());
        expect(lhr.categories.seo.score).toBeGreaterThanOrEqual(0.9);
      });

      it('has no secrets', async () => {
        expect(await page.content()).not.toContain('secrets');
      });
    });
  });

  describe('logged in', () => {
    beforeEach(async () => {
      const loginPage = await browser.newPage();
      await loginPage.goto('http://localhost:8000/');
      await loginPage.waitForSelector('input[type="email"]', {visible: true});

      const emailInput = await loginPage.$('input[type="email"]');
      await emailInput.type('admin@example.com');
      const passwordInput = await loginPage.$('input[type="password"]');
      await passwordInput.type('password');
      const submitInput = await loginPage.$('input[type="submit"]');
      await submitInput.press('Enter');
      await loginPage.waitForNavigation();

      await loginPage.close();
    });

    afterEach(async () => {
      await page.goto('http://localhost:8000/logout');
    });

    describe('homepage', () => {
      beforeEach(async () => {
        await page.goto('http://localhost:8000/');
      });

      it('lighthouse', async () => {
        const lhr = await runLighthouse(page.url());
        expect(lhr.categories.seo.score).toBeGreaterThanOrEqual(0.9);
      });
    });

    describe('dashboard', () => {
      beforeEach(async () => {
        await page.goto('http://localhost:8000/dashboard');
      });

      it('lighthouse', async () => {
        const lhr = await runLighthouse(page.url());
        expect(lhr.categories.seo.score).toBeGreaterThanOrEqual(0.9);
      });

      it('has secrets', async () => {
        expect(await page.content()).toContain('secrets');
      });
    });
  });
});
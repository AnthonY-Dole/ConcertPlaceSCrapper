const puppeteer = require("puppeteer");
const dotenv = require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = require("twilio")(accountSid, authToken);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const sendSms = async (text) => {
  client.messages
    .create({
      body: "Ticket disponible: " + text,
      from: "whatsapp:+14155238886",
      to: "whatsapp:+33781860480",
    })
    .then((message) => console.log(message.sid));
};

const main = async () => {
  const browserFetcher = puppeteer.createBrowserFetcher();
  let revisionInfo = await browserFetcher.download("1095492");
  const browser = await puppeteer.launch({
    executablePath: revisionInfo.executablePath,
    ignoreDefaultArgs: ["--disable-extensions"],
    headless: true,
    args: ["--no-sandbox", "--disabled-setupid-sandbox"],
  });
  const page = await browser.newPage();
  let pageUrl =
    "https://www.ticketmaster.fr/fr/manifestation/the-weeknd-billet/idmanif/520973";
  await page.goto(pageUrl), { waitUntil: "networkidle2" };

  if (await page.waitForSelector("#onetrust-accept-btn-handler")) {
    await page.click("#onetrust-accept-btn-handler");
  }

  await sleep(1000);
  if (
    await page.waitForSelector(
      "#page-main > div > div.event-wrapper.event-layout-wide > div.event-captcha > form > p > button"
    )
  ) {
    await page.click(
      "#page-main > div > div.event-wrapper.event-layout-wide > div.event-captcha > form > p > button"
    );
  }

  await sleep(2000);

  await page.waitForSelector(".session-price-cat");
  const tickets = await page.evaluate(() => {
    const info = document.querySelectorAll(".session-price-cat");

    const ticketsArray = [...info];
    const tickets = ticketsArray.map((ticket) =>
      ticket.innerText.replace(/\s/g, " ")
    );
    return tickets;
  });

  console.log(tickets);
  await page.waitForSelector(".session-price-cat-title-status");
  const available = await page.evaluate(() => {
    const price = document.querySelectorAll(".session-price-cat-title-status");

    const avaibleArray = [...price];

    const isAvailable = avaibleArray
      .map((ticket) => ticket)
      .filter((ticket) => ticket.innerText !== "Épuisé ²");

    return isAvailable;
  });

  console.log(available);
  if (available.length > 0) {
    console.log("Ticket available");
    await sendSms(tickets);
  } else {
    console.log("No ticket available");
  }
  await sleep(10000);
  await browser.close();
};

main();
setInterval(main, 1000 * 60 * 30);

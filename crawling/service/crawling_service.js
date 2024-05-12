const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const fs = require("fs");

const converter = require("../../utils/pdf_to_image_converter");
const upload_image = require("../../utils/upload_image");
const { randomUUID } = require("crypto");

const download_path = "./file";

async function find_row_length(page, tag_name) {
  const content = await page.content();
  const $ = cheerio.load(content);
  return $(tag_name).length;
}

const image_size = {
  width: 1181,
  height: 1748,
};

exports.crawling = async function (start_idx, batch_size, element_school_url) {
  const browser = await puppeteer.launch({
    // headless: false,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // executablePath: '/usr/bin/google-chrome-stable',
  });
  const page = await browser.newPage();
  await config_viewport(page);

  await page.goto(element_school_url);

  const page_idx_length = await find_row_length(
    page,
    "table.board_type01_tb_list tbody tr"
  );

  const data = [];

  for (let idx = 0; idx < page_idx_length; idx++) {
    await page.goto(element_school_url);

    const row = await page.evaluate((idx) => {
      const tr = document.querySelectorAll(
        "table.board_type01_tb_list tbody tr"
      )[idx];

      const target_idx = tr
        .querySelectorAll("td")[0]
        .textContent.match(/\d+/)[0];

      const td = tr.querySelectorAll("td")[1];
      target_link = td.querySelectorAll("a")[0];
      target_link.click();

      return target_idx;
    }, idx);

    try {
      await page.waitForFunction(() => {
        const elements = document.querySelectorAll(
          "table.board_type01_intable tbody tr"
        ).length;
        return elements > 0;
      });
    } catch (e) {
      continue;
    }

    const image_file_details = await get_image_file(browser, page);

    data.push({
      idx: row,
      file_info: image_file_details,
    });
  }

  await browser.close();

  console.log(data);

  return { data: data };
};

async function get_image_file(browser, page) {
  const inner_data_array = [];

  const page_file_length = await find_row_length(
    page,
    "table.board_type01_intable tbody tr"
  );

  for (let inner_idx = 0; inner_idx < page_file_length; inner_idx++) {
    const title = await page.evaluate((inner_idx) => {
      let tr = document.querySelectorAll("table.board_type01_intable tbody tr")[
        inner_idx
      ];
      let tds = tr.querySelectorAll("td");

      const target_link = tds[4].querySelectorAll("a")[1];

      target_link.click();

      return tds[1].textContent;
    }, inner_idx);

    await page.waitForTimeout(1000);

    const pages = await browser.pages();

    const image_page = pages[pages.length - 1];

    await image_page.waitForTimeout(1000);

    const pdf_path = `${download_path}/${randomUUID()}.pdf`;
    await config_viewport(image_page);

    await image_page.pdf({
      path: pdf_path,
      format: "A4",
    });

    console.log("pdf_path: ", pdf_path);

    const image_file_paths = await converter.convert(
      pdf_path,
      title,
      image_size
    );

    const image_url = [];
    image_file_paths.forEach((image_file_info) => {
      upload_image
        .upload_file(image_file_info.path, image_file_info.name)
        .then((url) => {
          image_url.push(url);
          fs.unlinkSync(image_file_info.path);
        });
    });

    // delete pdf file
    await fs.unlinkSync(pdf_path);

    await image_page.close();

    inner_data_array.push({
      title: title,
      image_url: image_url,
    });
  }
  return inner_data_array;
}

async function config_viewport(page) {
  await page.setViewport(image_size);
}

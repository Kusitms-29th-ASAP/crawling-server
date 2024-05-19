const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const fs = require("fs");

const converter = require("../../utils/pdf_to_image_converter");
const upload_image = require("../../utils/upload_image");
const { randomUUID } = require("crypto");
const { start } = require("repl");

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

const browser_option = {
  // headless: false,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  executablePath: "/usr/bin/google-chrome-stable",
  timeout: 600000,
  setViewport: {
    image_size,
  },
};

exports.crawling = async function (start_idx, batch_size, element_school_url) {
  const browser = await puppeteer.launch(browser_option);
  const page = await browser.newPage();

  await page.goto(element_school_url);

  const page_idx_length = await find_row_length(
    page,
    "table.board_type01_tb_list tbody tr"
  );

  const data = [];
  const chunkSize = 5;
  for (let i = 0; i < page_idx_length; i += chunkSize) {
    const chunk = Array.from(
      { length: Math.min(chunkSize, page_idx_length - i) },
      (_, idx) => process_page(element_school_url, i + idx, start_idx)
    );
    let chunkData = await Promise.all(chunk);
    chunkData = chunkData.filter(item => item.file_info.length > 0);
    data.push(...chunkData);
  }

  await browser.close();

  return { data: data };
};

async function process_page(element_school_url, idx, start_idx) {
  const browser = await puppeteer.launch(browser_option);
  const page = await browser.newPage();
  await page.goto(element_school_url);

  const row = await page.evaluate((idx) => {
    const tr = document.querySelectorAll("table.board_type01_tb_list tbody tr")[
      idx
    ];
    if(!tr) return null;

    const target_idx = tr.querySelectorAll("td")[0].textContent.match(/\d+/)[0];

    const td = tr.querySelectorAll("td")[1];
    target_link = td.querySelectorAll("a")[0];
    target_link.click();

    return target_idx;
  }, idx);

  const row_int = parseInt(row);
  const start_idx_int = parseInt(start_idx);

  if(row_int <= start_idx_int || !row){
    await browser.close();
    return {
      idx: idx,
      file_info: []
    }
  }

  try {
    await page.waitForFunction(() => {
      const elements = document.querySelectorAll(
        "table.board_type01_intable tbody tr"
      ).length;
      return elements > 0;
    });
  } catch (e) {
    return {
      idx: row,
      file_info: [],
    };
  }

  const image_file_details = await get_image_file(browser, page);

  return {
    idx: row,
    file_info: image_file_details,
  };
}

async function get_image_file(browser, page) {
  const inner_data_array = [];

  const page_file_length = await find_row_length(
    page,
    "table.board_type01_intable tbody tr"
  );

  for (let inner_idx = 0; inner_idx < page_file_length; inner_idx++) {
    const new_page_promise = new Promise((resolve) =>
      browser.once("targetcreated", (target) => resolve(target.page()))
    );

    const title = await page.evaluate((inner_idx) => {
      let tr = document.querySelectorAll("table.board_type01_intable tbody tr")[
        inner_idx
      ];
      let tds = tr.querySelectorAll("td");

      const target_link = tds[4].querySelectorAll("a")[1];
      target_link.click();

      return tds[1].textContent;
    }, inner_idx);

    const image_page = await new_page_promise;
    await image_page.waitForTimeout(3000);
    image_page.setViewport(image_size);

    const pdf_path = `${download_path}/${randomUUID()}.pdf`;

    await image_page.pdf({
      path: pdf_path,
      format: "A4",
    });

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
    fs.unlinkSync(pdf_path);

    await image_page.close();

    inner_data_array.push({
      title: title,
      image_url: image_url,
    });
  }
  return inner_data_array;
}

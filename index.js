const puppeteer = require("puppeteer")
const {PDFDocument} = require('pdf-lib');
const fsPromise = require('fs').promises;
const fs = require('fs')
const qoa = require("qoa")

const config = require("./config");

(async() => {
  let temp = "./pages/"
  let configuration = await initialize()
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: config.headless})
  const page = await browser.newPage();
  await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: config.quality
  })

  switch (configuration.type){
    case "Educahoc":
      await initializeTempFolder(temp)
      await educadhoc(browser, page, configuration, temp)
      break;
  }
})()

async function educadhoc(browser, page, configuration, temp){

    await page.goto(configuration.url);

    // Get the number of page
    let maxPageSelector = '#app > div > div.e-summary-panel > div > div:nth-child(2) > div.row.summary-tools.ma-0.pl-7.pr-7 > div.row.ma-0 > div.pa-0.col.col-12 > div > div.input-container.pa-0.pl-1.pr-4.col.col-6 > div > span'
    await page.waitForSelector(maxPageSelector)
    let element = await page.$(maxPageSelector)
    let maxPageRaw = await page.evaluate(el => el.textContent, element)
    let maxPage = parseInt(maxPageRaw.split(' ')[1])

    const baseUrl = await page.evaluate(() => { // Get the "base url" by getting the first iframe on the reader
        const iframe = document.querySelector('iframe');
        return iframe.src;
    });


    console.log("Starting to screenshot each pages...");
    for (let i = 1; i < maxPage; i++) {
        let url = baseUrl.replace("Page_1", "Page_" + i) // prepare url
        await page.goto(url)

        let body = await page.$("#page-container") // Take only the content part
        await body.screenshot({
          path: temp + i + ".jpeg",
          quality: 100
        })
    }
    console.log("All screenshot have been taken ! Creating the pdf...");
    await createPDF(configuration.output)
    await browser.close()
}




async function initialize(){
  const type = await qoa.interactive({
    query: 'Select the type of your manual.',
    handle: 'type',
    menu: [
      'Educahoc',
      'None (exit)'
    ]
  })

  if(type.type == "None (exit)"){
    console.log("Exiting... \nThank for using. Made by quentin72000 (https://github.com/quentin72000)");
     process.exit(0)
  }
  
  const url = await qoa.input({
    query: 'Type the url of your manual:',
    handle: 'url'
  });
  console.log(url);
  if(!url.url)throw new Error("Please input a url.") // Checing if url was provided.
  
  if(type.type == "Educahoc"){
    let regex = /^https:\/\/demo\.educadhoc\.fr\/reader\/textbook\/([0-9]{13})\/fxl\/Page_[0-9]+\?feature=freemium$/; // cheking if the url corespond to a EducahocReader url
    if(!regex.test(url.url))throw new Error("The url is not a correct EducahocReader url.")
  }

  const output = await qoa.input({
    query: 'Type the ouput pdf name:',
    handle: 'output'
  });

  return Object.assign({}, type, url, output);
}


async function initializeTempFolder(tempFolder){
  if(!fs.existsSync(tempFolder)){ // Creating the temp dir if doesnt exsist...
    console.log("Creating temp dir...")
    fs.mkdirSync(tempFolder);
  }else{
    console.log("Temp folder already exist (probably a forced-stop of the program), deleting and recreating...")
    await fsPromise.rm(tempFolder, { recursive: true })
    await fsPromise.mkdir(tempFolder)

  }
}



async function createPDF(outputFileName = "Manuel.pdf"){
    if(!outputFileName.endsWith(".pdf"))outputFileName += ".pdf";

    const files = await fsPromise.readdir('pages'); // Read all the files in the folder
    files.sort(function(a, b) {              // Order files by number
        var aNum = parseInt(a.match(/\d+/));
        var bNum = parseInt(b.match(/\d+/));
        return aNum - bNum;
    });

    const pdfDoc = await PDFDocument.create(); // Create a new PDF document

    
    // Add each file to the PDF as a new page
    for (const file of files) {

        const imgData = await fsPromise.readFile(`pages/${file}`);
        
        // Add the img to the PDF
        const image = await pdfDoc.embedJpg(imgData);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });
    }
    // Save the PDF to a file
    const pdfBytes = await pdfDoc.save();
    fsPromise.writeFile(outputFileName, pdfBytes).then(() => {
      console.log("Succefully saved to " + outputFileName + ". Cleaning before exiting...")

      try {
        fsPromise.rm("./pages/", { recursive: true })
      } catch (err) {
        console.error(err);
        console.error(`Error while cleaning... Aborted...`)
      }
      console.log("Finished ! Thank for using. Made by quentin72000 (https://github.com/quentin72000)");


    });
}


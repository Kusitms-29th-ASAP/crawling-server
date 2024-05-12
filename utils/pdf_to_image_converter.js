const {fromPath} = require('pdf2pic');
const fs = require('fs');
const pdf = require('pdf-parse');


exports.convert = async function(pdf_path,file_name, image_size) {
    console.log(`start converting pdf to image : ${pdf_path}`);

    // const pdf_size = await getPdfSize(pdf_path);

    const dataBuffer = fs.readFileSync(pdf_path);
    const pdf_page_number = await pdf(dataBuffer).then(function(data) {
        console.log(data.numpages);
        return data.numpages
    });

    const convert = fromPath(pdf_path, {
        quality: 100,
        density: image_size.width,   
        saveFilename: file_name,
        savePath: "./file",
        format: "png",
        width: image_size.width,
        height: image_size.height,
    })

    const image_paths = [];
    for (let i = 1; i <= pdf_page_number; i++) {
        const image_info = await convert(i, { responseType : "image"})
        .then((resolve) => {
            return {
                name: resolve.name,
                path: resolve.path
            };
        })
        image_paths.push(image_info);
    }

    return image_paths;
}
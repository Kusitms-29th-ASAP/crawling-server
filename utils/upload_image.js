const AWS = require('aws-sdk');
const fs = require('fs');
require("dotenv").config();
const endpoint = new AWS.Endpoint('https://kr.object.ncloudstorage.com');
const region = 'kr-standard';
const access_key = process.env.NCP_ACCESS_KEY;
const secret_key = process.env.NCP_SECRET_KEY;


const S3 = new AWS.S3({
    endpoint: endpoint,
    region: region,
    credentials: {
        accessKeyId : access_key,
        secretAccessKey: secret_key
    }
});


const bucket_name = 'school-point/image';


exports.upload_file = async function(local_file_path, file_name) {
    const object_name = file_name;

    // upload file
    await S3.putObject({
        Bucket: bucket_name,
        ContentType: 'image/png',
        Key: object_name,
        ACL: 'public-read',
        // ACL을 지우면 전체 공개되지 않습니다.
        Body: fs.createReadStream(local_file_path)
    }).promise();

    return endpoint.href + '/' + bucket_name + '/' + object_name;
}
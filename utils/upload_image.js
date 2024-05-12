const AWS = require('aws-sdk');
const { randomUUID } = require('crypto');
const fs = require('fs');
const endpoint = new AWS.Endpoint('https://kr.object.ncloudstorage.com');
const region = 'kr-standard';
const access_key = 'B954A007851205CA6877';
const secret_key = '9B330412FD90773B8816A64D4CA4EEAF3BFA48A0';

const  {uuidv7} = require("uuidv7");


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
    const object_name = uuidv7() + file_name;

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
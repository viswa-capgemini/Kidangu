import AWS from 'aws-sdk';



const dynamoDB = new AWS.DynamoDB.DocumentClient();
export default dynamoDB;

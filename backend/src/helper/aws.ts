import AWS from "aws-sdk";

let s3Temp: AWS.S3;

const initAwsTemp = () => {
	if (s3Temp instanceof AWS.S3) return s3Temp;

	s3Temp = new AWS.S3({
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		signatureVersion: "v4",
		region: "ap-south-1",
	});

	return s3Temp;
};

export const genSignedUrlTemp = (objectKey: string) => {
	initAwsTemp();

	return s3Temp.getSignedUrlPromise("putObject", {
		Bucket: "puneet-video-transcoding-temp",
		Key: objectKey,
		Expires: 240,
		ContentType: "video/mp4",
	});
};

export const genSignedUrl = () => {
	initAwsTemp();

	return s3Temp.getSignedUrlPromise("getObject", {
		Bucket: "puneet-video-transcoding",
		Key: objectKey,
		Expires: 240,
	});
};

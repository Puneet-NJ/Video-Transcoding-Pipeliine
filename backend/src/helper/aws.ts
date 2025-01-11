import AWS from "aws-sdk";
import { getSignedUrl } from "aws-cloudfront-sign";

var cfSigningParams = {
	keypairId: process.env.PUBLIC_KEY as string,
	privateKeyString: process.env.PRIVATE_KEY as string,
};

let s3: AWS.S3;

const initAws = () => {
	if (s3 instanceof AWS.S3) return s3;

	s3 = new AWS.S3({
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		signatureVersion: "v4",
		region: "ap-south-1",
	});

	return s3;
};

export const genSignedUrlTemp = (objectKey: string) => {
	initAws();

	return s3.getSignedUrlPromise("putObject", {
		Bucket: "puneet-video-transcoding-temp",
		Key: objectKey,
		Expires: 240,
		ContentType: "video/mp4",
	});
};

export const genSignedUrl = (objectKey: string) => {
	const signedUrl = getSignedUrl(
		process.env.CLOUDFRONT_URL + `/${objectKey}`,
		cfSigningParams
	);

	return signedUrl;
};

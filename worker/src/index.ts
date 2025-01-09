import { exec } from "child_process";
import { initAws, initRedis } from "./helper";
import axios from "axios";
import { s3 } from "./lib";
import path from "path";
import fs from "fs";
require("dotenv").config();

const main = async () => {
	const queue_name = "video-transcoding";
	const client = await initRedis();

	while (true) {
		const queueElement = await client.brPop(queue_name, 0);

		if (!queueElement?.element) return;

		const obj = JSON.parse(queueElement?.element);
		const objectKey = obj.objectKey;

		const uploadDir = path.join(__dirname, "..", "videos", objectKey);
		const videoDir = path.join(uploadDir, "video.mp4");

		try {
			// create a dir && get the video
			const vidResponse = await getVideo(objectKey, uploadDir, videoDir);
			if (vidResponse === 0) {
				console.log("err");
				return;
			}

			// transcode the video
			const transcodeResponse = await transcodeVideo(uploadDir, videoDir);
			if (transcodeResponse === 0) {
				console.log("err");
				return;
			}
			if (transcodeResponse === 1) console.log("transcoded");
			console.log(transcodeResponse);

			// put it in s3
			const putS3Res = await getFolder(uploadDir, objectKey);
			if (putS3Res === 0) {
				console.log("err");
				return;
			}
			console.log("should run after put s3");

			// update the backend
			await updateBackend(objectKey);
		} catch (err) {
			console.log(err);
		}
	}
};

const getVideo = async (
	objectKey: string,
	uploadDir: string,
	videoDir: string
) => {
	try {
		const response = await new Promise(async (res, rej) => {
			fs.mkdirSync(uploadDir);
			fs.writeFileSync(videoDir, "");

			const response = await axios({
				method: "GET",
				url: `${s3}/${objectKey}`,
				responseType: "stream",
			});

			const writer = fs.createWriteStream(videoDir);

			response.data.pipe(writer);

			writer.on("finish", () => {
				res(1);
			});

			writer.on("error", (err) => {
				rej(err);
			});
		});

		return response;
	} catch (err) {
		console.log(err);
	}
};

const transcodeVideo = async (uploadDir: string, videoDir: string) => {
	try {
		const qualityDir = path.join(uploadDir, "360p");
		const qualityDir480p = path.join(uploadDir, "480p");

		fs.mkdirSync(qualityDir);
		fs.mkdirSync(qualityDir480p);

		const command = `
ffmpeg -i ${videoDir} \
  -c:v h264 -c:a aac -b:a 128k \
  -s 640x360 -b:v 800k -hls_time 6 -hls_playlist_type vod -hls_segment_filename "${qualityDir}/360p_%03d.ts" ${qualityDir}/360p.m3u8 \
  -s 854x480 -b:v 1200k -hls_time 6 -hls_playlist_type vod -hls_segment_filename "${qualityDir480p}/480p_%03d.ts" ${qualityDir480p}/480p.m3u8
`;

		const process = exec(command, (err, stdout, stderr) => {
			if (err) {
				console.error("Error occurred:");
				return;
			}
			if (stderr) {
				console.error("Standard Error:");
				return;
			}
			// console.log(stdout);
		});

		const response = await new Promise((res, rej) => {
			process.on("exit", (code, signal) => {
				if (code === 0) {
					res(1);
				} else {
					rej(0);
				}
			});
		});

		console.log("res", response);

		return response;
	} catch (err) {
		console.log(err);
	}
};

const getFolder = async (folderPath: string, videoId: string) => {
	const dirContents = fs.readdirSync(folderPath);

	const response = await new Promise((res, rej) => {
		const promises: any[] = [];

		dirContents.forEach((eachQuality) => {
			if (eachQuality !== "video.mp4")
				promises.push(putChunks(folderPath, eachQuality, videoId));
		});

		Promise.all(promises)
			.then(() => res(1))
			.catch((err) => rej(0));
	});

	return response;
};

const putChunks = async (
	folderPath: string,
	eachQualityFolder: string,
	videoId: string
) => {
	try {
		const response = await new Promise(async (res, rej) => {
			const pa = path.join(folderPath, eachQualityFolder);
			const chunks = fs.readdirSync(pa);

			const promises: any[] = [];

			chunks.forEach((chunk) => {
				let s3FolderName;

				s3FolderName = `${videoId}/${eachQualityFolder}/${chunk}`;

				if (chunk.includes("m3u8")) {
					s3FolderName = `${videoId}/m3u8/${chunk}`;
				}

				promises.push(uploadToS3(s3FolderName, path.join(pa, chunk)));
			});

			await Promise.all(promises)
				.then((response) => res(1))
				.catch((err) => rej(0));
		});

		return response;
	} catch (err) {
		console.log(err);
	}
};

const uploadToS3 = async (key: string, filePath: string) => {
	const s3 = initAws();

	const content = fs.readFileSync(filePath);

	await new Promise((res, rej) => {
		s3.upload(
			{ Bucket: process.env.AWS_S3_BUCKET as string, Key: key, Body: content },
			(err, data) => {
				if (err) {
					console.log(err);
					rej(0);
				} else {
					res(1);
				}
			}
		);
	});
};

const updateBackend = async (objectKey: string) => {
	const res = await axios({
		method: "PUT",
		url: `${process.env.BACKEND_URL}/video/${objectKey}`,
		data: { status: "PROCESSED" },
	});

	console.log(res);
};

main();

// const uploadDir = path.join(
// 	__dirname,
// 	"..",
// 	"videos",
// 	"33c2c825-4dcd-42ce-b5f9-068343b621e5"
// );
// getFolder(uploadDir, "33c2c825-4dcd-42ce-b5f9-068343b621e5");

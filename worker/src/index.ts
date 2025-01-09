import { exec } from "child_process";
import { initRedis } from "./helper";
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

		// update the backend
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

		fs.mkdirSync(qualityDir);

		const command = `ffmpeg -i ${videoDir} -s 640x360 -c:v h264 -b:v 800k -c:a aac -b:a 128k -hls_time 6 -hls_playlist_type vod -hls_segment_filename "${qualityDir}/360p_%03d.ts" ${qualityDir}/360p.m3u8`;

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

main();

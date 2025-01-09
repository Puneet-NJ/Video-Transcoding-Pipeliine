import express from "express";
import "dotenv/config";
import client from "./helper/prisma";
import { genSignedUrlTemp } from "./helper/aws";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/signedUrl/:objectName", async (req, res) => {
	try {
		const objectName = req.params.objectName;

		const response = await client.video.create({
			data: { name: objectName, status: "PENDING" },
		});

		const signedUrl = await genSignedUrlTemp(response.id);

		res.json({ signedUrl });
	} catch (err) {
		res.status(500).json({ msg: "Internal Server Error" });
	}
});

app.put("/video/:videoId", async (req, res) => {
	try {
		const videoId = req.params.videoId;
		const body = req.body;

		const response = await client.video.update({
			where: { id: videoId },
			data: {
				status: body.status,
			},
		});

		res.json({ msg: "Done" });
	} catch (err) {
		res.status(500).json({ msg: "Internal Server Error" });
	}
});

app.get("/video/:videoId", async (req, res) => {
	try {
	} catch (err) {
		res.status(500).json({ msg: "Internal Server Error" });
	}
});

app.listen(5001);

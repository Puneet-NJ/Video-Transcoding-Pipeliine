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

app.listen(5001);

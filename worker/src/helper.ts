import { createClient } from "redis";

export const initRedis = async () => {
	let client = createClient({
		username: "default",
		password: process.env.REDIS_PASSWORD,
		socket: {
			host: process.env.REDIS_HOST,
			port: 15302,
		},
	});

	client.on("error", (err) => console.log("Redis Client Error", err));

	await client.connect();

	return client;
};

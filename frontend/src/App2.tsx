import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import { Link } from "react-router-dom";

function App2() {
	const [video, setVideo] = useState<File | null>(null);
	const [videos, setVideos] = useState([]);

	useEffect(() => {
		(async () => {
			const res = await axios({
				method: "GET",
				url: `http://localhost:5001/videos`,
			});
			setVideos(res.data.videos);
		})();
	}, []);

	const handleAddVideo = async () => {
		try {
			const backendRes = await axios({
				method: "GET",
				url: `http://localhost:5001/signedUrl/${"firstVid"}`,
			});
			if (backendRes.status !== 200) return;

			const tempS3Response = await axios({
				method: "PUT",
				url: `${backendRes.data.signedUrl}`,
				data: video,
				headers: { "Content-Type": "video/mp4" },
			});
			console.log(tempS3Response);
		} catch (err) {
			console.log(err);
		}
	};

	console.log(videos);

	return (
		<>
			<input
				type="file"
				accept="video/mp4"
				onChange={(e) => {
					if (!e.target.files) return;

					setVideo(e.target.files[0]);
				}}
			/>

			<button onClick={handleAddVideo}>Add Video</button>

			<br />
			<br />
			<br />
			<br />

			<div>
				{videos &&
					videos.map((eachVideo) => {
						return (
							<Link to={`/video/${eachVideo.id}`} key={eachVideo.id}>
								<div className="p-2 bg-gray-200 hover:underline w-[30%] shadow-lg">
									<div>{eachVideo.name}</div>
								</div>
							</Link>
						);
					})}
			</div>
		</>
	);
}

export default App2;

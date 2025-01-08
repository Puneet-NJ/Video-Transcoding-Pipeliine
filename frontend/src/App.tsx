import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
	const [video, setVideo] = useState<File | null>(null);

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
		</>
	);
}

export default App;

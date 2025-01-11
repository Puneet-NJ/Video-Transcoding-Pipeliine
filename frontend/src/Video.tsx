import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoJS from "./components/VideoJS";

const Video = () => {
	const [video, setVideo] = useState();

	const params = useParams();
	const videoId = params.videoId;

	useEffect(() => {
		(async () => {
			const video = await axios({
				method: "GET",
				url: `http://localhost:5001/video/${videoId}`,
			});
			setVideo(video.data.signedUrl);
		})();
	}, []);

	console.log(params);

	if (!video) return;
	return (
		<div className="">
			<VideoJS
				options={{
					autoplay: true,
					controls: true,
					responsive: true,
					fluid: true,
					sources: [
						{
							src: `${video}`,
							type: "application/x-mpegURL",
						},
					],
				}}
				// onReady={handlePlayerReady}
			/>
		</div>
	);
};

export default Video;

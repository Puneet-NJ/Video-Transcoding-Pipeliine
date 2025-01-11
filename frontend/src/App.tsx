import { BrowserRouter, Route, Routes } from "react-router-dom";
import App2 from "./App2";
import Video from "./Video";

const App = () => {
	return (
		<div>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<App2 />}></Route>
					<Route path="/video/:videoId" element={<Video />}></Route>
				</Routes>
			</BrowserRouter>
		</div>
	);
};

export default App;

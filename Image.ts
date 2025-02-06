/**
 * @package IceMonkey
 * @author gh Corgice @IceSandwich
 * @license GPL v3
 */


import { MIMEType } from "./Core";

function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement | null {
	let canvas = document.createElement("canvas");
	canvas.height = imageData.height;
	canvas.width = imageData.width;

	let ctx = canvas.getContext("2d");
	if (!ctx) {
		return null;
	}

	ctx.putImageData(imageData, 0, 0);
	return canvas;
}

export function IM_ImageDataToFile(imageData: ImageData, MIME: MIMEType): string | null {
	let logging = new IM_Logging("IM_ImageDataToFile");
	let canvas = imageDataToCanvas(imageData);
	if (canvas == null) {
		logging.Error("Failed to get context from canvas.");
		return null;
	}
	let ret = canvas.toDataURL(String(MIME));
	canvas.remove();
	return ret;
}

export function IM_ImageDataToBlob(imageData: ImageData): Promise<Blob | null> | null {
	let logging = new IM_Logging("IM_ImageDataToBlob");
	let canvas = imageDataToCanvas(imageData);
	if (canvas == null) {
		logging.Error("Failed to get context from canvas.");
		return null;
	}

	return new Promise((resolve, reject) => {
		canvas.toBlob(function (blob) {
			resolve(blob);
			canvas.remove();
		});
	});
}
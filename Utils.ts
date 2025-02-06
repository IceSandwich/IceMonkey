/**
 * @package IceMonkey
 * @author gh Corgice @IceSandwich
 * @license GPL v3
 */

export enum IM_BlobTextCharsets {
	UTF8 = "utf-8",
}
export class IM_BlobTextPlainOptions {
	protected mimeType = "text/plain";
	charset = IM_BlobTextCharsets.UTF8;
	
	ToTypeString() {
		return `${this.mimeType};charset=${this.charset}`;
	}
}
export class IM_BlobJsonOptions extends IM_BlobTextPlainOptions {
	protected mimeType = "application/json";
}
export function IM_CreateBlob(data: any[], options: IM_BlobTextPlainOptions | IM_BlobJsonOptions) {
	return new Blob(data, {
		type: options.ToTypeString()
	});
}



export function IM_ExtractFilename(path: string): string {
	let index = path.lastIndexOf("/");
	return path.substring(index + 1);
}



declare function saveAs(blob: Blob, filename: string): void;
const FILESAVER_CDN = "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js#sha512-Qlv6VSKh1gDKGoJbnyA5RMXYcvnpIqhO++MhIM2fStMcGT9i2T//tSwYFlcyoRRDcDZ+TYHpH8azBBCyhpSeqw==";
export class IM_FileSaver {
	private static logging = new IM_Logging("IM_FileSaver");
	static SaveAs(blob: Blob, filename:string): boolean {
		this.logging.Info(`Saving ${filename}`);
		try {
			saveAs(blob, filename);
			return true;
		} catch (e) {
			this.logging.Error(`Please include FileSaver.js in IM_context of greasemonkey script from ${FILESAVER_CDN}\nOriginal error message: ${e}`);
			return false;
		}
	}
}



const JSZIP_CDN = "https://cdn.jsdelivr.net/npm/jszip@3.6.0/dist/jszip.min.js#sha512-uVSVjE7zYsGz4ag0HEzfugJ78oHCI1KhdkivjQro8ABL/PRiEO4ROwvrolYAcZnky0Fl/baWKYilQfWvESliRA==";
interface JSZipCompressionOptions {
	level?: number,
};
interface JSZipOptions {
	type: "blob";
	compressed?: "DEFLATE",
	compressionOptions?: JSZipCompressionOptions
};
declare class JSZip {
	file(filename:string, data: any): void;
	folder(filename:string): void;
	generateAsync(options: JSZipOptions, metaFunc: (meta: any) => any): Promise<Blob>;
}
interface JSZipCallbackPercent {
	toFixed(n: number): number;
}
export interface JSZipCallback {
	percent: JSZipCallbackPercent;
	currentFile?: string;
}
export class IM_Zip {
	private logging: IM_Logging = new IM_Logging("IM_Zip");
	private instance: any;
	constructor() {
		try {
			this.instance = new JSZip();
		} catch(e) {
			this.logging.Error(`Please include JSZip in IM_context of greasemonkey script from ${JSZIP_CDN}\nOriginal error message: ${e}`);
			throw e;
		}
	}
	AddFile(filepath:string, data: any) {
		this.logging.Info(`add file: ${filepath}`);
		this.instance.file(filepath, data);
	}
	Folder(name: string) {
		this.instance.folder(name);
	}
	Download(zipName: string, callback?: (arg0: JSZipCallback)=>void) {
		this.instance.generateAsync({
			type: "blob",
		}, (metadata:JSZipCallback) => {
			if (callback) {
				callback(metadata);
			}
		}).then((content: Blob) => {
			this.logging.Info("pack to blob: ", content, "save to: ", zipName);
			IM_FileSaver.SaveAs(content, zipName);
		});
	}
}
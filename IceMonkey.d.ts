/**
 * @package IceMonkey
 * @author gh Corgice @IceSandwich
 * @license GPL v3
 */

/* global variables */
declare const IM_locationOrigin: string;
declare const IM_entryPoint: string;



/**
 * The native window instance.
 * 
 * greasymonkey use proxy for window in script by default, but sometimes we need the native window.
 */
declare const IM_window: Window;



/* greasemonkey variables */
// GM_info have been declared in greasemonkey.d.ts



/* functions */
/**
 * Sync GET request from url. Some browsers may implement it in async mode forcely.
 * 
 * **CANNOT** DO CORS REQUEST! 
 * 
 * If you want to do it, use `GM_xmlHttpRequest`(Async mode in most script managers).
 * @param url the url.
 */
declare function IM_RequestSyncGet(url: string): XMLHttpRequest;



/* classes */
declare class IM_Queue<T> {
	constructor();
	Enqueue(...element: T[]);
	Dequeue(): T;
	Clear(): void;
	Size(): number;
	IsEmpty(): boolean;
	Front(): T;
}

declare class IM_Stack<T> {
	constructor();
	Push(...element: T[]);
	Pop(): T;
	Clear(): void;
	Size(): number;
	IsEmpty(): boolean;
	Front(): T;
}

declare class IM_Logging {
	constructor(moduleName: string);
	Info(...data: any[]): void;
	Alert(message: string): void;
	Error(message: string): void;
	Fatal(message: string): void;
	Warning(message: string): void;
}

declare class IM_WebpackModuleManager {
	constructor();
	/**
	 * Append modules to manager.
	 * @param modules should be a dictionary. key: string, value: function (t, r, e) { ... }
	 */
	Append(modules: any): void;
	/**
	 * Get a module from manager by name.
	 * @param moduleName the name of module to require.
	 */
	require(moduleName: string): any;
}
declare const lang_strings: Record<string, string>;
declare const prismEditor: any;
declare const marked: any;

// ============ TypeScript Interfaces ============

interface FileEntry {
	uri: string;
	url: string;
	path: string;
	name: string;
	size: number | null;
	mime: string | null;
	modified: Date | null;
	is_dir: boolean;
	permissions: string | null;
}

interface DavState {
	headers: Record<string, string>;
	setAuth?: (username: string, password: string) => void;
	send?: (method: string, url: string, body?: any, headers?: Record<string, string>) => Promise<Response>;
	propfind?: (url: string, body: string, depth: number) => Promise<XMLDocument>;
	list?: (url: string) => Promise<Record<string, FileEntry>>;
	copymove?: (method: string, src: string, dst: string, overwrite?: boolean) => Promise<Response>;
	exists?: (url: string) => Promise<boolean>;
}

interface WopiState {
	discovery_url: string | null;
	mimes: Record<string, any>;
	extensions: Record<string, any>;
	[key: string]: any;
}

interface BrowserState {
	file: FileEntry;
	paste_selection: FileEntry[];
	paste_action: string | null;
	sort_order: string;
	sort_order_desc: boolean;
	url?: string;
	current?: FileEntry;
	files?: Record<string, FileEntry>;
	init?: () => void;
	open?: (url: string, push_history?: boolean) => void;
	createFilesList?: () => void;
	createRowActions?: (tr: HTMLTableRowElement) => void;
	setRowPermissions?: (tr: HTMLTableRowElement, file: FileEntry) => void;
	setRootPermissions?: (permissions: string | null) => void;
	createToolbar?: () => void;
	editFile?: (file: FileEntry) => void;
	editTextFile?: (file: FileEntry, allow_preview?: boolean) => void;
	editMarkdownFile?: (file: FileEntry) => void;
	[key: string]: any;
}

interface EditorState {
	dialog?: HTMLDialogElement;
	lastModified?: number;
	lastValue?: string;
	[key: string]: any;
}

interface CssState {
	main?: any;
	body?: any;
	html?: any;
	[key: string]: any;
}

let prop: any;
let pos: number;
let p: any;
let a: any;

const current_script = document.currentScript as HTMLScriptElement | null;
var css_url = (current_script?.src || '').replace(/\/[^\/]+$/, '') + '/webdav.css?2025';

const WebDAVNavigator = async function (url, options) {
	const PREVIEW_TYPES = /^image\/(png|webp|svg|jpeg|jpg|gif|png)|^application\/pdf|^text\/|^audio\/|^video\/|application\/x-empty/;
	const PREVIEW_EXTENSIONS = /\.(?:png|webp|svg|jpeg|jpg|gif|png|pdf|txt|css|js|html?|md|mp4|mkv|webm|ogg|flac|mp3|aac|m4a|avi)$/i;

	const OPENDOCUMENT_TEMPLATES = {
		'ods': 'UEsDBBQAAAAAAOw6wVCFbDmKLgAAAC4AAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0UEsDBBQAAAAIABxZFFFL43PrmgAAAEABAAAVAAAATUVUQS1JTkYvbWFuaWZlc3QueG1slVDRDoMgDHz3KwjvwvZK1H9poEYSKETqon8vLpluWfawPrXXy921XQTyIxY2r0asMVA5x14uM5kExRdDELEYtiZlJJfsEpHYfPLNXd2kGBpRqzvB0QdsK3nexIUtIbQZeOqllhcc0XloecvYS8g5eAvsE+kHOfWMod7dVckzgisTIkv9p61NxIdGveBHAMaV9bGu0p3++tXQ7FBLAwQUAAAACAAAWRRRA4GGVIkAAAD/AAAACwAAAGNvbnRlbnQueG1sXY/RCsIwDEWf9SvG3uv0Ncz9S01TLLTNWFJwf29xbljzEu49N1wysvcBCRxjSZTVIGetu3ulmAU2eu/LkoGtBIFsEwkoAs+U9yv4TcPtcu2nc1dn/DqCS5hVuqG1fe0y3iIZRxg/+LQzW5ST1YBGdI3Uwge7tcpDy7yQdfIk0i03NMFD/n85vQFQSwECFAMUAAAAAADsOsFQhWw5ii4AAAAuAAAACAAAAAAAAAAAAAAAtIEAAAAAbWltZXR5cGVQSwECFAMUAAAACAAcWRRRS+Nz65oAAABAAQAAFQAAAAAAAAAAAAAAtIFUAAAATUVUQS1JTkYvbWFuaWZlc3QueG1sUEsBAhQDFAAAAAgAAFkUUQOBhlSJAAAA/wAAAAsAAAAAAAAAAAAAALSBIQEAAGNvbnRlbnQueG1sUEsFBgAAAAADAAMAsgAAANMBAAAAAA==',
		'odp': 'UEsDBBQAAAAAAC6dVEszJqyoLwAAAC8AAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnByZXNlbnRhdGlvblBLAwQUAAAACAAsYRRRP7fJFJoAAABBAQAAFQAAAE1FVEEtSU5GL21hbmlmZXN0LnhtbJVQwQqDMAy97ytK77bbNaj/EmpkhTYtNg79+1VhujF2WC5JXh7vJWkjsh+pCLwKtcTA5Wg7PU8MCYsvwBipgDhImXhIbo7EAp98uJmrVv1F1WgPcPSBmkqeVnVicwhNRrl32uoTjjR4bGTN1GnMOXiH4hPbBw9mX8O8u5s8Ual552j7p69LLJtIPeHHBkKL2G1cpVv79az+8gRQSwMEFAAAAAgAMl4UUXz4vRWJAAAA/gAAAAsAAABjb250ZW50LnhtbF2P0QqDMAxFn+dXiO+d22tw/ksXUyjYpJgI8+8tOGVdXsK994Qkg4QQkWASXBOxORS20ttPmlnhSF/dujCI16jAPpGCIUgmPqfgl4bn/dGNTVtq+DqKS8ymbT82t9MLZZELHslNhHOd+dUkeYvo1LaZ6vAt01bkpfNCWm4ouPAB9hV5yf8fx2YHUEsBAhQDFAAAAAAALp1USzMmrKgvAAAALwAAAAgAAAAAAAAAAAAAALSBAAAAAG1pbWV0eXBlUEsBAhQDFAAAAAgALGEUUT+3yRSaAAAAQQEAABUAAAAAAAAAAAAAALSBVQAAAE1FVEEtSU5GL21hbmlmZXN0LnhtbFBLAQIUAxQAAAAIADJeFFF8+L0ViQAAAP4AAAALAAAAAAAAAAAAAAC0gSIBAABjb250ZW50LnhtbFBLBQYAAAAAAwADALIAAADUAQAAAAA=',
		'odg': 'UEsDBBQAAAAAAE8+S1PfJa3pNAAAADQAAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmdyYXBoaWNzLXRlbXBsYXRlUEsDBBQAAAAIALZDh1ScUI71nQAAAEEBAAAVAAAATUVUQS1JTkYvbWFuaWZlc3QueG1slVDNDoIwDD7LU5Ddt+l1Ad+lGUWWbF3DioG3F0kEjfHgrf365ftpk4BCj0Xca6jnFKnsa6umkVyGEoojSFiceJcZqct+SkjiPvnuYs7qWp2aHehDRL0Sx6U+sClGzSBDq6w64IRdAC0LY6uAOQYPEjLZO3Vmi2Denc1tBB6CL1owcQRBVdt/rH0meeqsDX6EEJzFbudVuLFfz7pWD1BLAwQUAAAACADDQ4dUUZP77oMAAAD2AAAACwAAAGNvbnRlbnQueG1sXY9BCoNADEXX9RTifmq7Dda7TDOZMjCTiIlUb1/BVrSr8PJ+CL+TGBMSBMGpEJtDYVtnPZfMCpt9NNPIIF6TAvtCCoYgA/HvCo5puF9vTV9dui8qjmkwrdvDLq5fXPRILhDms/OTSfGW0Kktmc7yKWFZcecw+nfi15ZpT6Ed/7v11QdQSwECFAMUAAAAAABPPktT3yWt6TQAAAA0AAAACAAAAAAAAAAAAAAAtIEAAAAAbWltZXR5cGVQSwECFAMUAAAACAC2Q4dUnFCO9Z0AAABBAQAAFQAAAAAAAAAAAAAAtIFaAAAATUVUQS1JTkYvbWFuaWZlc3QueG1sUEsBAhQDFAAAAAgAw0OHVFGT++6DAAAA9gAAAAsAAAAAAAAAAAAAALSBKgEAAGNvbnRlbnQueG1sUEsFBgAAAAADAAMAsgAAANYBAAAAAA==',
		'odt': 'UEsDBBQAAAAAAPMbH0texjIMJwAAACcAAAAIAAAAbWltZXR5cGVhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHRQSwMEFAAAAAgA3U0SUeqX5meSAAAAMQEAABUAAABNRVRBLUlORi9tYW5pZmVzdC54bWyVUEEOgzAMu+8VqHfa7Rq1/CUqQavUphUNE/wemDTYNO2wW2I7thWbkMNAVeA1NHOKXI/VqWlkyFhDBcZEFcRDLsR99lMiFvjUw01fVXdp7AEMIVK7CcelObEpxrag3J0y6oQT9QFbWQo5haXE4FFCZvPgXj8r6PdkLTSLMv+E+cyyX26df8TunmanN19rvr7TrVBLAwQUAAAACACQThJRWmJBaH8AAADjAAAACwAAAGNvbnRlbnQueG1sXY/RCsMgDEXf+xWj767ba+j8FxcjCGpKE6H9+wlbRfYUbs69uWTlECISeMaaqahBLtrm7cipCHzpa657AXYSBYrLJKAIvFG5UjC64Xl/zHZaf0pwj5vKYq9FaA0mOCTjCdMAXFXOTiMa0TNRI/3Im/3ZfUqHttQysqnL/0/sB1BLAQIUAxQAAAAAAPMbH0texjIMJwAAACcAAAAIAAAAAAAAAAAAAACkgQAAAABtaW1ldHlwZVBLAQIUAxQAAAAIAN1NElHql+ZnkgAAADEBAAAVAAAAAAAAAAAAAACkgU0AAABNRVRBLUlORi9tYW5pZmVzdC54bWxQSwECFAMUAAAACACQThJRWmJBaH8AAADjAAAACwAAAAAAAAAAAAAApIESAQAAY29udGVudC54bWxQSwUGAAAAAAMAAwCyAAAAugEAAAAA'
	};

	const _ = key => typeof lang_strings != 'undefined' && key in lang_strings ? lang_strings[key] : key;

	const download_button = `<a download title="${_('Download')}" class="btn download">${_('Download')}</a>`;
	const rename_button = `<input class="icon rename" type="button" value="${_('Rename')}" title="${_('Rename')}" />`;
	const delete_button = `<input class="icon delete" type="button" value="${_('Delete')}" title="${_('Delete')}" />`;
	const edit_button = `<input class="icon edit" type="button" value="${_('Edit')}" title="${_('Edit')}" />`;

	const mkdir_dialog = `<input type="text" name="mkdir" placeholder="${_('Directory name')}" />`;
	const mkfile_dialog = `<input type="text" name="mkfile" placeholder="${_('File name')}" />`;
	const rename_dialog = `<input type="text" name="rename" placeholder="${_('New file name')}" />`;
	const paste_upload_dialog = `<h3>Upload this file?</h3><input type="text" name="paste_name" placeholder="${_('New file name')}" />`;
	const edit_dialog = `<textarea name="edit" cols="70" rows="30"></textarea>`;
	const markdown_dialog = `<div id="mdp"><textarea name="edit" cols="70" rows="30"></textarea><div class="md_preview"></div></div>`;
	const delete_dialog = `<h3>${_('Confirm delete?')}</h3>`;
	const wopi_dialog = `<iframe id="wopi_frame" name="wopi_frame" allow="clipboard-read *; clipboard-write *;" allowfullscreen="true">
		</iframe>`;

	const dialog_tpl = `<dialog open><p class="close"><input type="button" value="&#x2716; ${_('Close')}" class="close" /></p><form><div>%s</div>%b</form></dialog>`;

	const html_tpl = `<!DOCTYPE html><html>
		<head><title></title><link rel="stylesheet" type="text/css" href="${css_url}" /></head>
		<body><main>
		<div class="toolbar">
			<div class="selected">
				<input type="button" class="icon download" value="${_('Download')}" />
				<input type="button" class="icon delete" value="${_('Delete')}" />
				<input type="button" class="icon cut" value="${_('Cut')}" />
				<input type="button" class="icon copy" value="${_('Copy')}" />
			</div>
			<div class="paste">
			</div>
			<div class="create">
				<input type="file" style="display: none;" multiple />
				<input class="icon upload" type="button" value="${_('Upload files')}" />
				<input class="icon mk" type="button" value="${_('New')}" />
				<div class="menu">
					<input class="icon mkdir" type="button" value="${_('Directory')}" />
					<input class="icon mktext" type="button" value="${_('Text file')}" />
					<div class="wopi">
						<h5>${_('Office document')}</h5>
						<input class="icon ODT" type="button" value="${_('Text')}" />
						<input class="icon ODS" type="button" value="${_('Spreadsheet')}" />
						<input class="icon ODP" type="button" value="${_('Presentation')}" />
						<input class="icon ODG" type="button" value="${_('Drawing')}" />
					</div>
				</div>
			</div>
		</div>
		<table>
			<thead>
				<tr>
					<td scope="col" class="check"><input type="checkbox" /><label><span></span></label></td>
					<td scope="col" class="name" data-sort="name"><button>${_('Name')}</button></td>
					<td scope="col" class="size" data-sort="size"><button>${_('Size')}</button></td>
					<td scope="col" class="date" data-sort="date"><button>${_('Date')}</button></td>
					<td></td>
				</tr>
			</thead>
			<tbody></tbody>
		</table>
		</main><div class="bg"></div></body></html>`;

	const paste_widget = `<div><strong>${_('%count% files selected')}</strong>
		<input type="button" value="%label%" class="icon %action%" />
		<input type="button" value="${_('Cancel')}" class="icon cancel" /></div>`;

	const parent_row_tpl = `<tr class="parent">
		<td class="check"></td>
		<th colspan="2"><a href="../"><span class="icon parent"><b></b></span> ${_('Back')}</a></th>
		<td class="date"></td>
		<td class="buttons"></td>
	</tr>`;

	const dir_row_tpl = `<tr data-permissions="%permissions%" class="%class%" data-name="%name%">
		<td class="check"><input type="checkbox" name="delete" value="%uri%" /><label><span></span></label></td>
		<th colspan="2"><a href="%uri%">%thumb% %name%</a></th>
		<td class="date">%modified%</td>
		<td class="buttons"><div>${rename_button} ${delete_button}</div></td>
	</tr>`;

	const file_row_tpl = `<tr data-permissions="%permissions%" data-mime="%mime%" data-size="%size%" data-name="%name%">
		<td class="check"><input type="checkbox" name="delete" value="%uri%" /><label><span></span></label></td>
		<th><a href="%uri%">%thumb% %name%</a></th>
		<td class="size">%size_bytes%</td>
		<td class="date">%modified%</td>
		<td class="buttons"><div>${edit_button} ${download_button} ${rename_button} ${delete_button}</div></td>
	</tr>`;

	const icon_tpl = `<span class="icon %icon%"><b>%icon%</b></span>`;
	const root_url = url.replace(/(?<!\/)\/.*$/, '/');
	const image_thumb_tpl = `<img src="${root_url}index.php/apps/files/api/v1/thumbnail/150/150/%path%" alt="" />`;

	const wopi_propfind_tpl = '<' + `?xml version="1.0" encoding="UTF-8"?>
		<D:propfind xmlns:D="DAV:" xmlns:W="https://interoperability.blob.core.windows.net/files/MS-WOPI/">
			<D:prop>
				<W:wopi-url/><W:token/><W:token-ttl/>
			</D:prop>
		</D:propfind>`;

	// Util functions ///////

	const template = (tpl, params) => {
		return tpl.replace(/%(\w+)%/g, (a, b) => {
			return params[b];
		});
	};

	const html = (unsafe) => {
		return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	};

	const basename = path => path.split('/').pop();
	const stripHostPrefix = (name) => {
		if (!name) {
			return name;
		}

		var host = null;

		try {
			host = new URL(base_url).hostname;
		}
		catch (e) {
			host = location.hostname || null;
		}

		if (host && name.indexOf(host) === 0) {
			name = name.substring(host.length);

			if (!name.length) {
				name = host;
			}
		}

		return name;
	};

	const dirname = path => {
		var parts = path.split('/');
		parts.pop();
		return parts.join('/');
	};

	const $ = (a) => document.querySelector(a);

	const formatBytes = (bytes) => {
		const unit = _('B');

		if (bytes >= 1024*1024*1024) {
			return Math.round(bytes / (1024*1024*1024)) + ' G' + unit;
		}
		else if (bytes >= 1024*1024) {
			return Math.round(bytes / (1024*1024)) + ' M' + unit;
		}
		else if (bytes >= 1024) {
			return Math.round(bytes / 1024) + ' K' + unit;
		}
		else {
			return bytes + '  ' + unit;
		}
	};

	const formatDate = (date) => {
		if (isNaN(date)) {
			return '';
		}

		var now = new Date;
		var nb_hours = (+(now) - +(date)) / 3600 / 1000;

		if (date.getFullYear() == now.getFullYear() && date.getMonth() == now.getMonth() && date.getDate() == now.getDate()) {
			if (nb_hours <= 1) {
				return _('%d minutes ago').replace(/%d/, Math.round(nb_hours * 60));
			}
			else {
				return _('%d hours ago').replace(/%d/, Math.round(nb_hours));
			}
		}
		else if (nb_hours <= 24) {
			return _('Yesterday, %s').replace(/%s/, date.toLocaleTimeString());
		}

		return date.toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric'});
	};

	const normalizeURL = (url) => {
		if (!url.match(/^https?:\/\//)) {
			var base = base_url;

			if (!base.match(/\/$/)) {
				base += '/';
			}

			url = new URL(url, base).href;
		}

		return url;
	};

	const joinURL = (base, path) => {
		base = normalizeURL(base || browser.url || current_url || base_url);

		if (!base.match(/\/$/)) {
			base += '/';
		}

		return new URL(path, base).href;
	};

	const changeURL = (uri, push) => {
		try {
			if (push) {
				history.pushState(1, null, uri);
			}
			else {
				history.replaceState(1, null, uri);
			}

			if (popstate_evt) return;

			popstate_evt = window.addEventListener('popstate', (e) => {
				var url = location.pathname;
				browser.open(url, false);
			});
		}
		catch (e) {
			// If using a HTML page on another origin
			location.hash = uri;
		}
	};

	// ============ Editor Manager ============
	// Encapsulates editor logic with explicit dependencies
	
	interface EditorDependencies {
		file: FileEntry;
		openDialog: (html: string, ok_btn?: boolean) => void;
		closeDialog: () => void;
		request: (method: string, url: string, body?: any) => Promise<Response>;
		translate: (key: string) => string;
		markdownToHTML?: (text: string) => string;
	}

	class TextEditor {
		originalContent: string = '';
		currentContent: string = '';
		autoSaveEnabled: boolean;
		autoSaveInterval?: number;
		preventCloseFn?: (e: BeforeUnloadEvent) => boolean | void;

		constructor(private deps: EditorDependencies) {
			this.autoSaveEnabled = localStorage.getItem('autosave') === '1' || localStorage.getItem('autosave') === 'true';
		}

		updateSaveStatus(statusEl: Element | null) {
			if (!statusEl) return;
			const isDirty = this.currentContent !== this.originalContent;
			statusEl.innerHTML = isDirty ? '⚠️ ' + this.deps.translate('Modified') : '✔️ ' + this.deps.translate('Saved');
		}

		save(content: string): Promise<Response> {
			this.currentContent = content;
			return this.deps.request('PUT', this.deps.file.url, content);
		}

		dispose() {
			if (this.autoSaveInterval) {
				clearInterval(this.autoSaveInterval);
			}
			if (this.preventCloseFn) {
				window.removeEventListener('beforeunload', this.preventCloseFn, { capture: true });
			}
		}

		bind(
			textEl: HTMLTextAreaElement | null,
			statusEl: Element | null,
			saveBtn: Element | null,
			closeBtn: Element | null,
			autosaveCheckbox: any
		) {
			if (!textEl) return;

			// Initialize content
			this.originalContent = textEl.value;
			this.currentContent = textEl.value;

			// Save button handler
			if (saveBtn) {
				(saveBtn as any).onclick = () => {
					this.save(textEl.value).then(() => {
						this.originalContent = textEl.value;
						this.updateSaveStatus(statusEl);
						this.handleClose(textEl);
					});
				};
			}

			// Close button handler
			if (closeBtn) {
				(closeBtn as any).onclick = () => this.handleClose(textEl);
			}

			// Autosave checkbox
			if (autosaveCheckbox) {
				autosaveCheckbox.checked = this.autoSaveEnabled;
				autosaveCheckbox.onchange = () => {
					this.autoSaveEnabled = autosaveCheckbox.checked;
					localStorage.setItem('autosave', this.autoSaveEnabled ? '1' : '0');
				};
			}

			// Keyboard shortcuts
			textEl.onkeydown = (e: KeyboardEvent) => {
				if (e.ctrlKey && e.key === 's') {
					this.save(textEl.value).then(() => {
						this.originalContent = textEl.value;
						this.updateSaveStatus(statusEl);
					});
					e.preventDefault();
					return false;
				} else if (e.key === 'Escape') {
					this.handleClose(textEl);
					e.preventDefault();
					return false;
				}
			};

			// Update status on input
			textEl.onkeyup = () => {
				this.currentContent = textEl.value;
				this.updateSaveStatus(statusEl);
			};

			// Prevent tab close if unsaved changes
			this.preventCloseFn = (e: BeforeUnloadEvent) => {
				if (this.currentContent === this.originalContent) {
					return;
				}
				e.preventDefault();
				e.returnValue = '';
				return true;
			};

			window.addEventListener('beforeunload', this.preventCloseFn, { capture: true });

			// Autosave interval (every 10 seconds)
			this.autoSaveInterval = window.setInterval(() => {
				if (this.autoSaveEnabled && this.currentContent !== this.originalContent) {
					this.save(textEl.value).then(() => {
						this.originalContent = textEl.value;
						this.updateSaveStatus(statusEl);
					});
				}
			}, 10000);
		}

		private handleClose(textEl: HTMLTextAreaElement) {
			if (this.currentContent !== this.originalContent) {
				if (!confirm(this.deps.translate('Your changes have not been saved. Do you want to cancel WITHOUT saving?'))) {
					return;
				}
			}
			this.dispose();
			this.deps.closeDialog();
		}

		bindMarkdownPreview(textEl: HTMLTextAreaElement | null, previewEl: Element | null) {
			if (!textEl || !previewEl || !this.deps.markdownToHTML) return;

			textEl.oninput = () => {
				previewEl.innerHTML = this.deps.markdownToHTML!(textEl.value);
			};

			textEl.oninput(null as any);

			// Sync scroll between editor and preview
			textEl.onscroll = (e: any) => {
				const p = e.target.scrollTop / (e.target.scrollHeight - e.target.offsetHeight);
				const target = e.target === previewEl ? textEl : previewEl as HTMLTextAreaElement;
				target.scrollTop = p * (target.scrollHeight - target.offsetHeight);
				e.preventDefault();
				return false;
			};
		}
	}

	// Classes ///////

	var dav: DavState = {'headers': {}},
		wopi: WopiState = {'discovery_url': null, 'mimes': {}, 'extensions': {}},
		browser: BrowserState = {
			file: {} as FileEntry,
			paste_selection: [],
			paste_action: null,
			sort_order: 'name',
			sort_order_desc: false
		};

	dav.setAuth = function (username, password) {
		dav.headers = {};

		if (username && password) {
			dav.headers['Authorization'] = 'Basic ' + btoa(user + ':' + password);
		}
	};

	dav.send = function (method: string, url: string, body?: any, headers?: Record<string, string>) {
		headers = Object.assign(headers || {}, dav.headers);
		return fetch(url, {method, body, headers});
	};

	dav.propfind = async function (url: string, body: string, depth?: number): Promise<XMLDocument> {
		var response = await dav.send!('PROPFIND', url, body, {'Depth': depth?.toString(), 'Content-Type': 'text/xml; charset=utf-8'});
		var text = await response.text();
		return new window.DOMParser().parseFromString(text as string, "text/xml");
	};

	dav.list = async function (url: string): Promise<Record<string, FileEntry>> {
		const body = '<'+ `?xml version="1.0" encoding="UTF-8"?>
			<D:propfind xmlns:D="DAV:" xmlns:oc="http://owncloud.org/ns">
				<D:prop>
					<D:getlastmodified/><D:getcontenttype/><D:getcontentlength/><D:resourcetype/><D:displayname/><oc:permissions/>
				</D:prop>
			</D:propfind>`;

		url = normalizeURL(url);
		var compare_url = url.replace(/\/+$/, '');
		var xml = await dav.propfind(url, body, 1);
		var files: Record<string, any> = {};

		xml.querySelectorAll('response').forEach((node) => {
			var path = node.querySelector('href').textContent;
			var item_uri = normalizeURL(path);
			var compare_item_uri = item_uri.replace(/\/+$/, '');
			var props = null;

			node.querySelectorAll('propstat').forEach(propstat => {
				if (propstat.querySelector('status').textContent.match(/200/)) {
					props = propstat;
				}
			});

			// This item didn't return any properties, everything is 404?
			if (!props) {
				console.error('Cannot find properties for: ' + item_uri);
				return;
			}

			var name = item_uri.replace(/\/$/, '').split('/').pop();
			name = decodeURIComponent(name);
			if (prop = node.querySelector('displayname')) {
				name = prop.textContent;
			}
			name = stripHostPrefix(name);
			var is_dir = node.querySelector('resourcetype collection') ? true : false;

			files[compare_item_uri === compare_url ? '.' : name] = {
				'uri': item_uri,
				'url': item_uri,
				'path': item_uri.substring(base_url.length),
				'name': name,
				'size': !is_dir && (prop = node.querySelector('getcontentlength')) ? parseInt(prop.textContent, 10) : null,
				'mime': !is_dir && (prop = node.querySelector('getcontenttype')) ? prop.textContent : null,
				'modified': (prop = node.querySelector('getlastmodified')) ? new Date(prop.textContent) : null,
				'is_dir': is_dir,
				'permissions': (prop = node.querySelector('permissions')) ? prop.textContent : null,
			};
		});

		return files;
	};

	dav.copymove = function(method: string, src: string, dst: string, overwrite?: boolean): Promise<Response> {
		dst = normalizeURL(dst);
		var overwrite_header = overwrite === true ? 'T' : 'F';
		return dav.send(method, src, '', {'Destination': dst, 'Overwrite': overwrite_header});
	};

	dav.exists = async function (url: string): Promise<boolean> {
		var r = await dav.send('HEAD', url);
		return r.status === 200;
	};

	browser.init = () => {
		document.title = _('My files');
		document.querySelector('html').innerHTML = html_tpl;
		browser.createToolbar();

		//var column = document.querySelector('thead td[data-sort="' + browser.sort_order + '"]').className += ' selected ' + (browser.sort_order_desc ? 'desc' : 'asc');
		// Create actions for sorting buttons
		document.querySelectorAll('thead td[data-sort] button').forEach(elm => (elm as any).onclick = (e) => {
			var new_sort_order = e.target.parentNode.dataset.sort;

			if (browser.sort_order == new_sort_order) {
				browser.sort_order_desc = !browser.sort_order_desc;
			}

			browser.sort_order = new_sort_order;

			window.localStorage.setItem('sort_order', new_sort_order);
			window.localStorage.setItem('sort_order_desc', browser.sort_order_desc ? '1' : '0');
			browser.reload();
		});

		// Check all by checking box in table header
		(document.querySelector('thead td.check input') as any).onchange = (e: any) => {
			document.querySelectorAll('tbody td.check input').forEach(i => (i as any).checked = e.target.checked);
		};
	};

	browser.open = function (url, push_history) {
		closeDialog();
		browser.url = normalizeURL(url);
		current_url = browser.url;
		dav.list(url).then(files => {
			var compare_current_url = browser.url.replace(/\/+$/, '');
			browser.current = files['.'] || (Object.values(files) as any[]).find((f: any) => (f.uri || f.url || '').replace(/\/+$/, '') === compare_current_url);
			delete files['.'];
			browser.files = files;

			if (!browser.current) {
				browser.current = {
				'uri': browser.url!,
				'url': browser.url!,
				'path': (browser.url || '').substring(base_url.length),
				'name': _('My files'),
				'size': null,
				'mime': null,
				'modified': null,
				'is_dir': true,
				'permissions': null,
			};
		}

		var title: string = browser.current.name;


			document.title = title;

			browser.setRootPermissions(browser.current ? browser.current.permissions : null);
			browser.createFilesList();

			changeURL(browser.url, push_history);
		});
	};

	browser.createFilesList = () => {
		var items: any[] = Object.values(browser.files) as any[];

		// Sort files using specified order
		items.sort((a: any, b: any) => {
			if (browser.sort_order === 'date') {
				return a.modified - b.modified;
			}
			else if (browser.sort_order === 'size') {
				return a.size - b.size;
			}
			else {
				return a.name.localeCompare(b.name);
			}
		});

		// Sort with directories first
		if (browser.sort_order !== 'date') {
			items.sort((a: any, b: any) => b.is_dir - a.is_dir);
		}

		if (browser.sort_order_desc) {
			items = items.reverse();
		}

		var rows = '';

		// Add link to parent directory
		if (browser.current.url !== base_url) {
			rows += parent_row_tpl;
		}

		items.forEach((item: any) => {
			// Don't include files we cannot read
			if (item.permissions !== null && item.permissions.indexOf('G') == -1) {
				console.error('OC permissions deny read access to this file: ' + item.name, 'Permissions: ', item.permissions);
				return;
			}

			var row = item.is_dir ? dir_row_tpl : file_row_tpl;

			// Build a render-only copy so the stored file object is not mutated
			var render: any = Object.assign({}, item);
			render.size_bytes = render.size !== null ? formatBytes(render.size).replace(/ /g, '&nbsp;') : null;

			if (!render.is_dir && (pos = render.uri.lastIndexOf('.'))) {
				var ext = render.uri.substr(pos+1).toUpperCase();

				if (ext.length > 4) {
					ext = '';
				}
			}

			render.icon = ext || '';
			render.class = render.is_dir ? 'dir' : 'file';
			render.modified = render.modified !== null ? formatDate(render.modified) : null;
			render.name = html(render.name);

			if (render.mime && render.mime.match(/^image\//) && options.nc_thumbnails) {
				render.thumb = template(image_thumb_tpl, render);
			}
			else {
				render.thumb = template(icon_tpl, render);
			}

			rows += template(row, render);
		});

		document.querySelector('main > table > tbody').innerHTML = rows;

		document.querySelectorAll('table tbody tr').forEach(browser.createRowActions);
	};

	browser.setRowPermissions = (tr, file) => {
		// Assume we can do anything if no permissions are supplied
		// https://web.archive.org/web/20250829204116/https://doc.owncloud.com/desktop/next/appendices/architecture.html#server-side-permissions
		var permissions = file.permissions || 'WCKDNV';
		var p = permissions.split('');
		var hideButton = (a: string) => {
			var btn = tr.querySelector('.buttons .' + a) as HTMLElement | null;
			if (btn) {
				btn.style.display = 'none';
			}
		};

		if (p.indexOf('V') == -1) {
			hideButton('rename');
		}

		if (permissions.indexOf('D') == -1) {
			hideButton('delete');
		}

		if (file.is_dir || permissions.indexOf('W') == -1) {
			hideButton('edit');
		}

		// if (mime.match(/^text\/|application\/x-empty/))
	};

	browser.createRowActions = (tr) => {
		// Ignore parent row
		if (tr.classList.contains('parent')) {
			tr.querySelector('a').onclick = () => {
				browser.open(dirname(browser.current.uri || browser.url), true);
				return false;
			};
			return;
		}

		var $$ = (a) => tr.querySelector(a);
		var row_input = $$('td.check input[name=delete]');
		var file_url = row_input ? row_input.value : $$('a').href;
		var file_key = normalizeURL(file_url).replace(/\/+$/, '');
		var file: any = (Object.values(browser.files) as any[]).find((f: any) => (f.uri || f.url || '').replace(/\/+$/, '') === file_key);
		if (!file) {
			return;
		}
		file_url = file.uri || file.url;

		browser.setRowPermissions(tr, file);

		var dir = $$('[colspan]');
		var mime = !dir ? tr.getAttribute('data-mime') : 'dir';
		var permissions = file.permissions || 'WCKDNV';

		if (dir || file.is_dir) {
			$$('a').onclick = () => {
				browser.open(file_url, true);
				return false;
			};

			return;
		}

		$$('.buttons .rename').onclick = () => {
			openDialog(rename_dialog);
			let t = $('input[name=rename]');
			t.value = file.name;
			t.focus();
			t.selectionStart = 0;
			t.selectionEnd = file.name.lastIndexOf('.');
			document.forms[0].onsubmit = () => {
				var name = t.value;

				if (!name) return false;

				return dav.copymove('MOVE', file_url, joinURL(current_url, encodeURIComponent(name)), false)
					.then(() => browser.reload())
					.catch(e => {
						console.error(e);
						alert(e);
						return false;
					});
			};
		};

		$$('.buttons .delete').onclick = (e) => {
			openDialog(delete_dialog);
			document.forms[0].onsubmit = () => {
				return reqAndReload('DELETE', file_url);
			};
		};

		if (!file.is_dir) {
			var download_btn = $$('.buttons .download');
			if (download_btn) {
				download_btn.href = '#';
				download_btn.download = file.name;
				download_btn.onclick = (e) => {
					e.preventDefault();
					download(file.name, file.size, file_url);
					return false;
				};
			}
		}

		var allow_preview = false;
		var mime_str = mime || '';

		// Don't preview PDF in mobile, it doesn't work
		if ((mime_str == 'application/pdf' || file.name.match(/\.pdf$/i))
			&& window.navigator.userAgent.match(/Mobi|Tablet|Android|iPad|iPhone/)) {
			allow_preview = false;
		}
		else if (mime_str.match(PREVIEW_TYPES)
			|| file.name.match(PREVIEW_EXTENSIONS)) {
			allow_preview = true;
		}

		var edit_url = null, view_url;
			var is_text_editable = (file.mime || '').match(/^text\/|application\/x-empty/)
				|| file.name.match(/\.(md|txt|json|xml|ini|url|html?|css|js)$/i);
			var is_markdown = file.name.match(/\.md$/i);
			var can_edit = false;
			var edit_action = null;

			if (permissions.indexOf('W') != -1) {
				edit_url = wopi.getEditURL(file_url, file.mime);
				can_edit = is_text_editable || !!edit_url;

				if (edit_url) {
					edit_action = () => { wopi.open(file_url, edit_url); return false; };
					$$('.icon').classList.add('document');
				}
				else {
					// Always allow text-editor fallback for any writable file
					edit_action = () => { browser.editFile(file); return false; };
				}

				if ($$('.buttons .edit')) {
					$$('.buttons .edit').onclick = edit_action;
				}
			}

			if (allow_preview && !is_markdown) {
				$$('th a').onclick = () => { browser.openPreview(file); return false; };
			}
			else if (can_edit) {
				$$('th a').onclick = edit_action;
			}
			// Open WOPI viewer
			else if (view_url = wopi.getViewURL(file_url, mime_str)) {
				$$('.icon').classList.add('document');
				$$('th a').onclick = () => { wopi.open(file_url, view_url); return false; };
			}
			else if (!file.is_dir) {
				$$('th a').href = '#';
				$$('th a').download = file.name;
				$$('th a').onclick = (e) => {
					e.preventDefault();
					download(file.name, file.size, file_url);
					return false;
				};
			}
		};
	browser.editFile = (file) => {
		return browser.editTextFile(file);
	};

	browser.openPreview = (file) => {
		if (file.name.match(/\.md$/i)) {
			openDialog('<div class="md_preview"></div>', false);
			$('dialog').className = 'preview';
			req('GET', file.url).then(r => r.text()).then(t => {
				$('.md_preview').innerHTML = editor.markdownToHTML(t);
			});
			return false;
		}

		if (user && password) {
			(async () => { preview(file.mime, await get_url(file.url)); })();
		}
		else {
			preview(file.mime, file.url);
		}

		return false;
	};

	browser.editTextFile = (file: FileEntry) => {
		// Fetch file content
		req('GET', file.url).then((r) => r.text()).then((content: string) => {
			const isMarkdown = file.url.match(/\.md$/i);

			// Setup dialog
			$('body').classList.add('dialog');
			const tpl = dialog_tpl.replace(/%b/, '');
			$('body').insertAdjacentHTML('beforeend', tpl.replace(/%s/, isMarkdown ? markdown_dialog : edit_dialog));

			const dlg = $('dialog') as HTMLDialogElement;
			dlg.classList.add('editor-dialog');
			if (isMarkdown) {
				dlg.classList.add('editor-dialog-md');
			}

			// Customize close button
			const closeWrap = dlg.querySelector('.close');
			if (closeWrap) {
				closeWrap.className = 'editor-close-wrap';
				closeWrap.innerHTML = `<input type="button" value="\u00D7" class="editor-close" title="${_('Close')}" aria-label="${_('Close')}" />`;
			}

			// Add toolbar
			const form = dlg.querySelector('form');
			if (form) {
				form.insertAdjacentHTML('afterbegin', `<div class="toolbar editor-toolbar">
					<label><input type="checkbox" class="autosave" /> ${_('Autosave')}</label>
					<span class="status"></span>
					<input class="save" type="button" value="${_('Save and close')}" />
				</div>`);
			}

			// Get UI elements
			const txt = dlg.querySelector('textarea[name=edit]') as HTMLTextAreaElement;
			if (!txt) return;  // Safety check
			
			txt.value = content;  // Pre-populate textarea with fetched content
			
			const statusEl = dlg.querySelector('.editor-toolbar .status');
			const closeBtn = dlg.querySelector('.editor-close');
			const saveBtn = dlg.querySelector('.editor-toolbar .save');
			const autosaveCheckbox = dlg.querySelector('.editor-toolbar .autosave') as any;

			// Create editor instance
			const textEditor = new TextEditor({
				file,
				openDialog: (html, ok_btn) => openDialog(html, ok_btn),
				closeDialog: () => closeDialog(),
				request: (method, url, body) => req(method, url, body),
				translate: (key) => _(key),
				markdownToHTML: (text) => editor.markdownToHTML(text)
			});

			// Bind editor events
			textEditor.bind(txt, statusEl, saveBtn, closeBtn, autosaveCheckbox);

			// Setup markdown preview if needed
			if (isMarkdown) {
				const previewEl = dlg.querySelector('.md_preview');
				textEditor.bindMarkdownPreview(txt, previewEl);
			}

			// Form submission handler
			if (document.forms[0]) {
				document.forms[0].onsubmit = () => {
					return reqAndReload('PUT', file.url, txt?.value);
				};
			}
		});
	};

	browser.reload = function () {
		stopLoading();
		browser.open(browser.url, false);
	};

	browser.getFreeFilename = function (filename) {
		var increment_filename = (filename) => filename.replace(/(?:\s+\((\d+)\))?(\.[^.]+)?$/, (_, i, ext) => {
			var n = parseInt(i || 0, 10) + 1;
			return ' (' + n + ')' + (ext || '');
		});

		var j = 0;

		while (browser.files.hasOwnProperty(filename)) {
			filename = increment_filename(filename);

			if (j++ > 100) {
				break;
			}
		}

		return filename;
	};

	browser.pasteTo = function (src, action) {
		// Don't do anything is cutting and pasting in the same directory
		if (action === 'move' && browser.url === src.split('/').slice(0, -1).join('/')) {
			console.error('Cannot paste on itself');
			return;
		}

		var filename = browser.getFreeFilename(basename(decodeURIComponent(src)));
		return dav.copymove(action === 'copy' ? 'COPY' : 'MOVE', src, browser.url + filename, false);
	};

	browser.cancelPasteSelection = function () {
		css.hide('.toolbar .paste');
		browser.paste_selection = [];
		browser.paste_action = null;
	};

	browser.applyPasteSelection = async function () {
		animateLoading();

		for (var i = 0; i < browser.paste_selection.length; i++) {
			await browser.pasteTo(browser.paste_selection[i], browser.paste_action);
		}

		browser.cancelPasteSelection();
		browser.reload();
	};

	browser.createPasteSelection = (action) => {
		var l: any[] = Array.from(document.querySelectorAll('input[name=delete]:checked'));

		if (!l.length) {
			alert(_('No file is selected'));
			return;
		}

		browser.paste_selection = [];
		browser.paste_action = action;

		for (var i = 0; i < l.length; i++) {
			browser.paste_selection.push(l[i].value);
			l[i].checked = false;
		}

		var label = action == 'copy' ? _('Copy here') : _('Move here');
		$('.toolbar .paste').innerHTML = template(paste_widget, {
			'count' : browser.paste_selection.length,
			action,
			label
		});

		css.show('.toolbar .paste');
		$('.toolbar .paste .cancel').onclick = browser.cancelPasteSelection;

		$('.toolbar .paste .move, .toolbar .paste .copy').onclick = browser.applyPasteSelection;
	};

	browser.downloadSelectedFiles = async () => {
		var items: any[] = Array.from(document.querySelectorAll('tbody input[type=checkbox]:checked'));
		for (var i = 0; i < items.length; i++) {
			var input = items[i];
			var row: any = input.parentNode.parentNode;

			// Skip directories
			if (!row.dataset.mime) {
				return;
			}

			await download(row.dataset.name, row.dataset.size, row.querySelector('th a').href);
		}
	};

	browser.deleteSelectedFiles = () => {
		var l: any[] = Array.from(document.querySelectorAll('input[name=delete]:checked'));

		if (!l.length) {
			alert(_('No file is selected'));
			return;
		}

		openDialog(delete_dialog);
		document.forms[0].onsubmit = () => {
			animateLoading();

			for (var i = 0; i < l.length; i++) {
				reqOrError('DELETE', l[i].value);
			}

			// Don't reload too fast
			window.setTimeout(() => {
				stopLoading();
				browser.reload();
			}, 500);
		};
	};

	var editor: any = {};
	editor.create = (input_name, file_name, text) => {
		if ('prismEditor' in window) {
			var e = document.createElement('div');
			const ed = prismEditor(e, {
				language: file_name.match(/\.md$/i) ? 'markdown' : 'text',
				value: text,
				wordwrap: true
			});
			ed.textarea.name = input_name;

			return ed.textarea;
		}

		var t = document.createElement('textarea');
		t.name = input_name;
		t.value = text;
		return t;
	};

	editor.markdownToHTML = (text) => {
		if ('marked' in window) {
			return marked.parse(text);
		}

		text = text.replace(/\r\n|\r/g, "\n");
		text = html(text);
		text = text.replace(/^(#+)\s*(.+)$/mg, (_, h, t) => '<h' + h.length + '>' + t + '</h' + h.length + '>');
		text = text.replace(/\n{2,}/g, '<p>');
		text = text.replace(/\[(.*)\]\((.*)\)/g, (_, l, h) => '<a href="' + h + '">' + (l || h) + '</a>');
		return text;
	};

	var css: any = {};
	css.all = (selector) => document.querySelectorAll(selector);
	css.hide = (selector) => css.all(selector).forEach(e => e.style.display = 'none');
	css.show = (selector) => css.all(selector).forEach(e => e.style.display = 'inherit');
	css.toggle = (selector, show) => show ? css.show(selector) : css.hide(selector);
	css.onclick = (selector, callback) => css.all(selector).forEach(el => el.onclick = (ev) => callback(ev, el));

	browser.createToolbar = () => {
		$('.toolbar .download').onclick = browser.downloadSelectedFiles;
		$('.toolbar .copy').onclick = () => browser.createPasteSelection('copy');
		$('.toolbar .cut').onclick = () => browser.createPasteSelection('move');
		$('.toolbar .delete').onclick = () => browser.deleteSelectedFiles;

		// Hide stuff that can only be used if permissions allow
		css.hide('.toolbar .create, .toolbar .copy, .toolbar .cut, .toolbar .delete, .toolbar .menu, .toolbar .menu .wopi');

		var menu = $('.toolbar .menu');
		menu.dataset.visible = '0';

		var toggle_menu = () => {
			menu.dataset.visible = menu.dataset.visible == 0 ? 1 : 0;
			menu.style.display = menu.dataset.visible == 1 ? 'flex' : 'none';
		};

		$('.toolbar .mk').onclick = toggle_menu;

		if (wopi.extensions) {
			css.show('.toolbar .menu .wopi');

			css.onclick('.toolbar .menu .wopi input', (ev, btn) => {
				toggle_menu();
				openDialog(mkfile_dialog);
				var t = $('input[name=mkfile]');
				var ext = btn.className.substr(-3).toLowerCase();
				t.focus();
				document.forms[0].onsubmit = () => {
					var name = t.value;
					closeDialog();

					if (!name) return false;

					name = encodeURIComponent(name + '.' + ext);
					var file_url = joinURL(current_url, name);

					// Cannot use atob here, or JS will send blob as unicode text
					fetch('data:application/octet-stream;base64,' + OPENDOCUMENT_TEMPLATES[ext]).then(r => r.blob()).then(r => {
						req('PUT', file_url, r, {'Content-Type': 'application/octet-stream'}).then(() => {
							wopi.open(file_url, wopi.getEditURL(file_url, ext));
						});
					});

					return false;
				};
			});
		}

		$('.mkdir').onclick = () => {
			openDialog(mkdir_dialog);
			document.forms[0].onsubmit = () => {
				var name = $('input[name=mkdir]').value;

				if (!name) return false;

				name = encodeURIComponent(name);

				req('MKCOL', joinURL(current_url, name)).then(() => browser.open(joinURL(current_url, name + '/'), true));
				return false;
			};
		};

		$('.mktext').onclick = () => {
			openDialog(mkfile_dialog);
			var t = $('input[name=mkfile]');
			t.value = '.md';
			t.focus();
			t.selectionStart = t.selectionEnd = 0;
			document.forms[0].onsubmit = () => {
				var name = t.value;

				if (!name) return false;

				name = encodeURIComponent(name);

				return reqAndReload('PUT', joinURL(current_url, name), '');
			};
		};

		var fi = $('input[type=file]');

		$('.upload').onclick = () => fi.click();

		fi.onchange = () => {
			if (!fi.files.length) return;
			uploadFiles(fi.files);
		};
	};

	browser.setRootPermissions = (perms) => {
		css.toggle('toolbar .create', !perms || perms.indexOf('C') != -1 || perms.indexOf('K') != -1);
	};

	const reqXML = (method, url, body = null, headers?) => {
		return req(method, url, body, headers).then((r) => {
				if (!r.ok) {
					throw new Error(r.status + ' ' + r.statusText);
				}
				return r.text();
			}).then(str => new window.DOMParser().parseFromString(str, "text/xml"));
	};

	const reqHandler = (r: Response, c?: () => void): Response | Promise<string> => {
		if (!r.ok) {
			return r.text().then(t => {
				var message;
				if (a = t.match(/<((?:\w+:)?message)>(.*)<\/\1>/)) {
					message = "\n" + a[2];
				}

				throw new Error(r.status + ' ' + r.statusText + message);
			});
		}
		if (c) {
			window.setTimeout(c, 200);
		}
		return r;
	};

	const reqAndReload = (method: string, url: string, body?: any, headers?: Record<string, string>): boolean => {
		animateLoading();
		req(method, url, body, headers).then(r => {
			if (r.ok) {
				window.setTimeout(() => {
					stopLoading();
					browser.reload();
				}, 200);
			} else {
				return r.text().then(t => {
					var message = '';
					if (a = t.match(/<((?:\w+:)?message)>(.*)<\/\1>/)) {
						message = "\n" + a[2];
					}
					throw new Error(r.status + ' ' + r.statusText + message);
				});
			}
		}).catch(e => {
			console.error(e);
			alert(e);
		});
		return false;
	};

	const req = (method: string, url: string, body?: any, headers?: Record<string, string>): Promise<Response> => {
		return dav.send(method, url, body, headers);
	};

	const xhr = (method: string, url: string, progress_callback?: (e: ProgressEvent) => void): Promise<Blob> => {
		var xhr = new XMLHttpRequest();
		current_xhr = xhr;
		xhr.responseType = 'blob';
		var p = new Promise<Blob>((resolve, reject) => {
			xhr.open(method, url);
			xhr.onload = function () {
				if (this.status >= 200 && this.status < 300) {
					resolve(xhr.response);
				} else {
					reject({
						status: this.status,
						statusText: xhr.statusText
					});
				}
			};
			xhr.onerror = function () {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			};
			if (progress_callback) {
				xhr.onprogress = progress_callback;
			}
			xhr.send();
		});
		return p;
	};

	const uploadFiles = (files: any[]): void => {
		animateLoading();

		(async () => {
			for (var i = 0; i < files.length; i++) {
				var f = files[i];
				await reqOrError('PUT', joinURL(current_url, encodeURIComponent(f.name)), f);
			}

			window.setTimeout(() => {
				browser.reload();
			}, 500);
		})();
	};

	const reqOrError = (method: string, url: string, body?: any): Promise<Response | string> => {
		return req(method, url, body).then(r => reqHandler(r) as any).catch(e => {
			console.error(e);
			alert(e);
			browser.reload();
			throw e;
		});
	}

	const get_url = async (url) => {
		var progress = (e) => {
			var p = $('progress');
			if (!p || e.loaded <= 0) return;
			p.value = e.loaded;
			$('.progress_bytes').innerHTML = formatBytes(e.loaded);
		};

		if (temp_object_url) {
			window.URL.revokeObjectURL(temp_object_url);
		}

		return await xhr('GET', url, progress).then((blob: any) => {
			temp_object_url = window.URL.createObjectURL(blob as Blob);
			return temp_object_url;
		});
	};

	wopi.init = async function (discovery_url) {
		try {
			var d = await reqXML('GET', discovery_url);
		}
		catch (e) {
			// FIXME: notify
			return;
		}

		d.querySelectorAll('app').forEach(app => {
			var mime = (a = app.getAttribute('name').match(/^.*\/.*$/)) ? a[0] : null;
			wopi.mimes[mime] = {};

			app.querySelectorAll('action').forEach(action => {
				var ext = action.getAttribute('ext').toUpperCase();
				var url = action.getAttribute('urlsrc').replace(/<[^>]*&>/g, '');
				var name = action.getAttribute('name');

				if (mime) {
					wopi.mimes[mime][name] = url;
				}
				else {
					if (!wopi.extensions.hasOwnProperty(ext)) {
						wopi.extensions[ext] = {};
					}

					wopi.extensions[ext][name] = url;
				}
			});
		});
	};

	wopi.getEditURL = (name, mime) => {
		var file_ext = name.replace(/^.*\.(\w+)$/, '$1').toUpperCase();

		if (wopi.mimes.hasOwnProperty(mime) && wopi.mimes[mime].hasOwnProperty('edit')) {
			return wopi.mimes[mime].edit;
		}
		else if (wopi.extensions.hasOwnProperty(file_ext) && wopi.extensions[file_ext].hasOwnProperty('edit')) {
			return wopi.extensions[file_ext].edit;
		}

		return null;
	};

	wopi.getViewURL = (name, mime) => {
		var file_ext = name.replace(/^.*\.(\w+)$/, '$1').toUpperCase();

		if (wopi.mimes.hasOwnProperty(mime) && wopi.mimes[mime].hasOwnProperty('view')) {
			return wopi.mimes[mime].view;
		}
		else if (wopi.extensions.hasOwnProperty(file_ext) && wopi.extensions[file_ext].hasOwnProperty('view')) {
			return wopi.extensions[file_ext].view;
		}

		return wopi.getEditURL(name, mime);
	};

	wopi.open = async (document_url, wopi_url) => {
		var properties = await reqXML('PROPFIND', document_url, wopi_propfind_tpl, {'Depth': '0'});
		var src = (a = properties.querySelector('wopi-url')) ? a.textContent : null;
		var token = (a = properties.querySelector('token')) ? a.textContent : null;
		var token_ttl = (a = properties.querySelector('token-ttl')) ? a.textContent : +(new Date(Date.now() + 3600 * 1000));

		if (!src || !token) {
			alert('Cannot open document: WebDAV server did not return WOPI properties');
		}

		wopi_url += '&WOPISrc=' + encodeURIComponent(src);

		openDialog(wopi_dialog, false);
		$('dialog').className = 'preview';

		var f = $('dialog form');
		f.target = 'wopi_frame';
		f.action = wopi_url;
		f.method = 'post';
		f.insertAdjacentHTML('beforeend', `<input name="access_token" value="${token}" type="hidden" /><input name="access_token_ttl" value="${token_ttl}" type="hidden" />`);
		f.submit();
	};

	const openDialog = (html, ok_btn = true) => {
		var tpl = dialog_tpl.replace(/%b/, ok_btn ? `<p><input type="submit" value="${_('OK')}" /></p>` : '');
		$('body').classList.add('dialog');
		$('body').insertAdjacentHTML('beforeend', tpl.replace(/%s/, html));
		$('.close input').onclick = closeDialog;
		evt = window.addEventListener('keyup', (e) => {
			if (e.key != 'Escape') return;
			closeDialog();
			return false;
		});
		if (a = $('dialog form input, dialog form textarea')) a.focus();
	};

	const closeDialog = (e?) => {
		if (!$('body').classList.contains('dialog')) {
			return;
		}

		if (current_xhr) {
			current_xhr.abort();
			current_xhr = null;
		}

		window.onbeforeunload = null;

		$('body').classList.remove('dialog');
		if (!$('dialog')) return;
		$('dialog').remove();
		window.removeEventListener('keyup', evt);
		evt = null;
	};

	const download = async (name, size, url) => {
		window.onbeforeunload = () => {
			if (current_xhr) {
				current_xhr.abort();
			}

			return true;
		};

		openDialog(`<p class="spinner"><span></span></p>
			<h3>${html(name)}</h3>
			<progress max="${size}"></progress>
			<p><span class="progress_bytes"></span> / ${formatBytes(size)}</p>`, false);

		await get_url(url);
		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = temp_object_url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(temp_object_url);
		a.remove();

		closeDialog();
		window.onbeforeunload = null;
	};

	const preview = (type, url) => {
		if (type.match(/^image\//)) {
			openDialog(`<img src="${url}" />`, false);
		}
		else if (type.match(/^audio\//)) {
			openDialog(`<audio controls="true" autoplay="true" src="${url}" />`, false);
		}
		else if (type.match(/^video\//)) {
			openDialog(`<video controls="true" autoplay="true" src="${url}" />`, false);
		}
		else {
			openDialog(`<iframe src="${url}" />`, false);
		}

		$('dialog').className = 'preview';
	};

	const animateLoading = () => {
		document.body.classList.add('loading');
	};

	const stopLoading = () => {
		document.body.classList.remove('loading');
	};

	var items = [[], []];
	var current_xhr = null;
	var current_url = url;
	var base_url = url;
	const user = options.user || null;
	const password = options.password || null;
	dav.setAuth(user, password);

	if (location.pathname.indexOf(base_url) === 0) {
		current_url = location.pathname;
	}

	if (!base_url.match(/^https?:/)) {
		base_url = location.href.replace(/^(https?:\/\/[^\/]+\/).*$/, '$1') + base_url.replace(/^\/+/, '');
	}

	var evt, paste_upload, popstate_evt, temp_object_url;
	var sort_order = window.localStorage.getItem('sort_order') || 'name';
	var sort_order_desc = !!parseInt(window.localStorage.getItem('sort_order_desc'), 10);
	browser.sort_order = sort_order;
	browser.sort_order_desc = sort_order_desc;

	wopi.discovery_url = options.wopi_discovery_url || null;
	options.autosave = options.autosave || false;

	// Wait for WOPI discovery before creating the list
	if (wopi.discovery_url) {
		await wopi.init(wopi.discovery_url);
	}

	browser.init();
	browser.open(current_url);

	window.addEventListener('paste', (e) => {
		let items = e.clipboardData.items;
		const IMAGE_MIME_REGEX = /^image\/(p?jpeg|gif|png)$/i;

		for (var i = 0; i < items.length; i++) {
			if (items[i].kind === 'file' || IMAGE_MIME_REGEX.test(items[i].type)) {
				e.preventDefault();
				let f = items[i].getAsFile();
				let name = f.name == 'image.png' ? f.name.replace(/\./, '-' + (+(new Date)) + '.') : f.name;

				paste_upload = f;

				openDialog(paste_upload_dialog);

				let t = $('input[name=paste_name]');
				t.value = name;
				t.focus();
				t.selectionStart = 0;
				t.selectionEnd = name.lastIndexOf('.');

				document.forms[0].onsubmit = () => {
					name = encodeURIComponent(t.value);
					return reqAndReload('PUT', joinURL(current_url, name), paste_upload);
				};

				return;
			}
		}
	});

	var dragcounter = 0;

	window.addEventListener('dragover', (e) => {
		e.preventDefault();
		e.stopPropagation();
	});

	window.addEventListener('dragenter', (e) => {
		e.preventDefault();
		e.stopPropagation();

		if (!dragcounter) {
			document.body.classList.add('dragging');
		}

		dragcounter++;
	});

	window.addEventListener('dragleave', (e) => {
		e.preventDefault();
		e.stopPropagation();
		dragcounter--;

		if (!dragcounter) {
			document.body.classList.remove('dragging');
		}
	});

	window.addEventListener('drop', (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		document.body.classList.remove('dragging');
		dragcounter = 0;

		var files = Array.from(e.dataTransfer.items).map((item: any) => item.getAsFile());

		files = files.filter((f: any) => f !== null);

		if (!files.length) return;

		uploadFiles(files);
	});
};

const html_node = document.querySelector('html');

if (html_node) {
	const bootstrap_url = html_node.getAttribute('data-webdav-url');

	if (bootstrap_url) {
		const allow_insecure = html_node.getAttribute('data-allow-insecure-webdav') ? true : false;

		if (allow_insecure && location.protocol === 'https:' && bootstrap_url.match(/^http:\/\//)) {
			// Running the app itself over HTTP avoids mixed-content restrictions for HTTP WebDAV endpoints.
			location.href = location.href.replace(/^https:/, 'http:');
		}
		else {
			WebDAVNavigator(bootstrap_url, {
				'wopi_discovery_url': html_node.getAttribute('data-wopi-discovery-url'),
				'nc_thumbnails': html_node.getAttribute('data-nc-thumbnails') ? true : false
			});
		}
	}
}

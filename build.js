const fs = require("fs");
const path = require("path");
const { minify: minify_html } = require("html-minifier-terser");
const { minify: minify_js } = require("terser");

const projectDir = __dirname;
const outputDir = path.join(projectDir, "dist");

const ignoredDirectories = new Set([
	".git",
	".github",
	"node_modules",
	"dist",
]);

const ignoredFiles = new Set([
	"package.json",
	"package-lock.json",
	"build.js",
]);

async function process_file(sourcePath, outputPath) {
	const extension = path.extname(sourcePath).toLowerCase();

	fs.mkdirSync(path.dirname(outputPath), {
		recursive: true,
	});

	if (extension === ".html" || extension === ".htm") {
		const source = fs.readFileSync(sourcePath, "utf8");

		const result = await minify_html(source, {
			collapseWhitespace: true,
			removeComments: true,
			removeRedundantAttributes: true,
			removeScriptTypeAttributes: true,
			removeStyleLinkTypeAttributes: true,
			useShortDoctype: true,
			minifyCSS: true,
			minifyJS: true,
		});

		fs.writeFileSync(outputPath, result);
		return;
	}

	if (extension === ".js" || extension === ".mjs") {
		const source = fs.readFileSync(sourcePath, "utf8");
		const result = await minify_js(source);

		if (result.error) {
			throw result.error;
		}

		fs.writeFileSync(outputPath, result.code);
		return;
	}

	if (extension === ".css") {
		const source = fs.readFileSync(sourcePath, "utf8");

		const result = await minify_html(`<style>${source}</style>`, {
			collapseWhitespace: true,
			removeComments: true,
			minifyCSS: true,
		});

		const minifiedCss = result
			.replace(/^<style>/, "")
			.replace(/<\/style>$/, "");

		fs.writeFileSync(outputPath, minifiedCss);
		return;
	}

	fs.copyFileSync(sourcePath, outputPath);
}

async function process_directory(currentDir, relativeDir = "") {
	const entries = fs.readdirSync(currentDir, {
		withFileTypes: true,
	});

	for (const entry of entries) {
		const sourcePath = path.join(currentDir, entry.name);
		const relativePath = path.join(relativeDir, entry.name);
		const outputPath = path.join(outputDir, relativePath);

		if (entry.isDirectory()) {
			if (ignoredDirectories.has(entry.name)) {
				continue;
			}

			await process_directory(sourcePath, relativePath);
			continue;
		}

		if (ignoredFiles.has(entry.name)) {
			continue;
		}

		await process_file(sourcePath, outputPath);
	}
}

async function build() {
	fs.rmSync(outputDir, {
		recursive: true,
		force: true,
	});

	fs.mkdirSync(outputDir, {
		recursive: true,
	});

	await process_directory(projectDir);

	console.log("Build completed.");
}

build().catch((error) => {
	console.error(error);
	process.exit(1);
});
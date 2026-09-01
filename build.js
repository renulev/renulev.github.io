const fs = require("fs");
const path = require("path");
const { minify: minifyHtml } = require("html-minifier-terser");
const { minify: minifyJs } = require("terser");
const CleanCSS = require("clean-css");

const sourceDir = path.resolve("./");
const outputDir = path.resolve("./dist");

function get_files(directory) {
const files = [];

```
for (const entry of fs.readdirSync(directory, {
	withFileTypes: true
})) {
	const filePath = path.join(directory, entry.name);

	if (entry.isDirectory()) {
		files.push(...get_files(filePath));
	} else {
		files.push(filePath);
	}
}

return files;
```

}

async function build_file(sourcePath) {
const relativePath = path.relative(
sourceDir,
sourcePath
);

```
const outputPath = path.join(
	outputDir,
	relativePath
);

fs.mkdirSync(
	path.dirname(outputPath),
	{ recursive: true }
);

const source = fs.readFileSync(
	sourcePath,
	"utf8"
);

if (sourcePath.endsWith(".html")) {
	const result = await minifyHtml(source, {
		collapseWhitespace: true,
		removeComments: true,
		removeRedundantAttributes: true,
		removeEmptyAttributes: true,
		minifyCSS: true,
		minifyJS: true
	});

	fs.writeFileSync(outputPath, result);
	return;
}

if (sourcePath.endsWith(".js")) {
	const result = await minifyJs(source);

	fs.writeFileSync(
		outputPath,
		result.code
	);

	return;
}

if (sourcePath.endsWith(".css")) {
	const result = new CleanCSS().minify(source);

	if (result.errors.length > 0) {
		throw new Error(
			result.errors.join("\n")
		);
	}

	fs.writeFileSync(
		outputPath,
		result.styles
	);

	return;
}

// Images, fonts, models, etc.
fs.copyFileSync(
	sourcePath,
	outputPath
);
```

}

async function build() {
fs.rmSync(outputDir, {
recursive: true,
force: true
});

```
fs.mkdirSync(outputDir, {
	recursive: true
});

const files = get_files(sourceDir);

for (const filePath of files) {
	await build_file(filePath);
}

console.log(
	`Built ${files.length} files into dist/`
);
```

}

build().catch(error => {
console.error(error);
process.exit(1);
});

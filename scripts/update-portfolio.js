#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(repoRoot, "portfolio-projects.json");
const readmePath = path.join(repoRoot, "README.md");
const assetDir = path.join(repoRoot, "assets", "portfolio");
const startMarker = "<!-- portfolio-projects:start -->";
const endMarker = "<!-- portfolio-projects:end -->";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assertString(value, name, filePath) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${filePath}: missing required string "${name}"`);
  }
}

function latestReadyEntry(timeline) {
  return [...timeline]
    .filter((entry) => entry.ready !== false)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
}

function assetOutputName(project, screenshot) {
  if (screenshot.outputName) {
    return screenshot.outputName;
  }

  const ext = path.extname(screenshot.path);
  const base = path.basename(screenshot.path, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${project.slug}-${base}${ext}`;
}

function copyScreenshot(projectDir, project, screenshot) {
  const source = path.resolve(projectDir, screenshot.path);
  const outputName = assetOutputName(project, screenshot);
  const destination = path.join(assetDir, outputName);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing screenshot: ${source}`);
  }

  fs.mkdirSync(assetDir, { recursive: true });
  fs.copyFileSync(source, destination);

  return {
    src: `assets/portfolio/${outputName}`,
    alt: screenshot.alt || project.title,
    width: screenshot.width || 360
  };
}

function loadProject(entry) {
  const metadataPath = path.resolve(repoRoot, entry.metadataPath);
  const projectDir = path.dirname(metadataPath);
  const project = readJson(metadataPath);

  assertString(project.title, "title", metadataPath);
  assertString(project.slug, "slug", metadataPath);
  assertString(project.summary, "summary", metadataPath);
  assertString(project.description, "description", metadataPath);
  assertString(project.status, "status", metadataPath);

  if (project.ready === false) {
    return null;
  }

  if (!Array.isArray(project.techStack) || project.techStack.length === 0) {
    throw new Error(`${metadataPath}: "techStack" must be a non-empty array`);
  }

  if (!Array.isArray(project.timeline) || project.timeline.length === 0) {
    throw new Error(`${metadataPath}: "timeline" must be a non-empty array`);
  }

  const latest = latestReadyEntry(project.timeline);
  if (!latest) {
    throw new Error(`${metadataPath}: no ready timeline entry found`);
  }

  assertString(latest.date, "timeline[].date", metadataPath);
  assertString(latest.title, "timeline[].title", metadataPath);
  assertString(latest.description, "timeline[].description", metadataPath);

  const screenshots = Array.isArray(latest.screenshots)
    ? latest.screenshots.map((screenshot) => copyScreenshot(projectDir, project, screenshot))
    : [];

  return {
    ...project,
    latest: {
      ...latest,
      screenshots
    }
  };
}

function imageHtml(screenshots) {
  if (!screenshots.length) {
    return "";
  }

  const images = screenshots
    .map((screenshot) => `  <img src="${screenshot.src}" alt="${screenshot.alt}" width="${screenshot.width}">`)
    .join("\n");

  return `\n<p>\n${images}\n</p>\n`;
}

function renderProject(project) {
  return [
    `### ${project.title}`,
    "",
    project.summary,
    "",
    project.description,
    "",
    `**Tech stack:** ${project.techStack.join(", ")}.`,
    "",
    `**Status:** ${project.status}`,
    "",
    `**Latest progress (${project.latest.date}):** ${project.latest.title}. ${project.latest.description}`,
    imageHtml(project.latest.screenshots).trimEnd()
  ].join("\n");
}

function replaceGeneratedSection(readme, generated) {
  if (readme.includes(startMarker) && readme.includes(endMarker)) {
    const before = readme.slice(0, readme.indexOf(startMarker) + startMarker.length);
    const after = readme.slice(readme.indexOf(endMarker));
    return `${before}\n${generated}\n${after}`;
  }

  const heading = "## Selected Prototypes";
  const nextHeading = "\n## Interests";
  const start = readme.indexOf(heading);
  const end = readme.indexOf(nextHeading);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not find README insertion point");
  }

  return [
    readme.slice(0, start),
    heading,
    "",
    startMarker,
    generated,
    endMarker,
    readme.slice(end)
  ].join("\n");
}

function main() {
  const config = readJson(configPath);
  if (!Array.isArray(config.projects)) {
    throw new Error(`${configPath}: "projects" must be an array`);
  }

  const projects = config.projects.map(loadProject).filter(Boolean);
  const generated = projects.map(renderProject).join("\n\n");
  const readme = fs.readFileSync(readmePath, "utf8");
  const nextReadme = replaceGeneratedSection(readme, generated);

  fs.writeFileSync(readmePath, nextReadme.endsWith("\n") ? nextReadme : `${nextReadme}\n`);
  console.log(`Updated ${projects.length} portfolio projects.`);
}

main();

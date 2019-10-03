#!/usr/bin/env node

/**
 * A very simple script that applies templates in the format %{VAR_NAME} to
 * files and their contents.
 *
 * It reads the replacements from the environment.
 */

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function main() {
  const [,,templatePath, outputPath] = process.argv;
  if (!templatePath || !outputPath) die('Usage: node replace.js <templatePath> <outputPath>');

  walk(templatePath, (err, filePath) => {
    const templatedFilePath = applyTemplate(path.relative(templatePath, filePath));
    const outputFilePath = path.join(outputPath, templatedFilePath);

    fs.mkdir(path.dirname(outputFilePath), { recursive: true }, (err) => {
      if (err) return cb(err);

      const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
      });

      const outputFileStream = fs.createWriteStream(outputFilePath);
      rl.on('line', (line) => {
        outputFileStream.write(applyTemplate(line) + '\n');
      });
    });
  });
}

function stripDirectory(inputPath) {
  const segments = inputPath.split(path.sep);
  segments.shift();
  return segments.join(path.sep);
}

function applyTemplate(input) {
  const re = /%\{(.+?)\}/g;
  return input.replace(re, (match, templateVarName, index) => {
    if (!process.env[templateVarName]) {
      die(`No replacement found for "${templateVarName}"`);
    }

    return process.env[templateVarName];
  });
}

function walk(dirPath, cb) {
  fs.readdir(dirPath, (err, entries) => {
    if (err) return cb(err);
    entries.forEach((entry) => {
      const entryPath = path.join(dirPath, entry);
      fs.stat(entryPath, (err, stats) => {
        if (err) return cb(err);
        if (stats.isDirectory()) {
          walk(entryPath, cb);
        } else {
          cb(null, entryPath);
        }
      });
    });
  });
}

function die(message) {
  console.error(message);
  process.exit(1);
}

if (require.main === module) {
  main();
}

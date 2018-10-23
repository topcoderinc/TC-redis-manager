const git = require('git-last-commit');
const config = require('config');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const FILE_NAME = 'lastCommit.json';

/**
 * get last commit information from git command
 * @return {Promise<*>}
 */
async function getLastCommit() {
  return new Promise(((resolve, reject) => {
    git.getLastCommit(function (err, commit) {
      if (err) {
        return reject(err);
      }
      resolve({
        commitSha: commit.hash,
        author: commit.author,
        committedOn: new Date(commit.committedOn * 1000),
        subject: commit.subject,
        message: commit.body,
        notes: commit.notes,
      });
    });
  }))
}

/**
 * create last commit json file
 * @return {Promise<void>}
 */
async function generateLastCommitJson() {
  try {
    const lastCommit = await getLastCommit();
    fs.writeFileSync(path.join(config.WORK_ROOT, FILE_NAME), JSON.stringify(lastCommit, null, 2));
  } catch (e) {
    logger.error('generateLastCommitJson failed');
    logger.error(e);
  }
}

/**
 * get last commit from file, if not exist, it will try to create one
 * @return {Promise<*>}
 */
async function getLastCommitFromFile() {
  try {
    if (!fs.existsSync(path.join(config.WORK_ROOT, FILE_NAME))) {
      await generateLastCommitJson();
    }
    const content = fs.readFileSync(path.join(config.WORK_ROOT, FILE_NAME));
    return JSON.parse(content.toString());
  } catch (e) {
    logger.error(e);
    return e;
  }
}

module.exports = {
  generateLastCommitJson, getLastCommitFromFile
};

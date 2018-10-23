const git = require('../common/git');

(async () => {
  await git.generateLastCommitJson();
})();

const yargs = require('yargs')
const fs = require('fs')

const argv = yargs
  .option('versiontag', {
    type: 'string',
    description: 'specifies the version tag (CI_COMMIT_TAG)'
  })
  .option('jobid', {
    type: 'string',
    description:
      'specifies the gitlab job id (CI_JOB_ID). Used to link back to job artifacts'
  })
  .option('gitlabpath', {
    type: 'string',
    description:
      'The path on gitlab where this branch is stored (CI_PROJECT_PATH)'
  })
  .demandOption(['gitlabpath', 'versiontag', 'jobid']).argv

const systemRaw = fs.readFileSync('system.json')
let system = JSON.parse(systemRaw)

system.version = `${argv.versiontag}`
system.url = `https://gitlab.com/${argv.gitlabpath}`
system.manifest = `https://gitlab.com/${argv.gitlabpath}/-/jobs/${argv.jobid}/artifacts/raw/system.json`
system.download = `https://gitlab.com/${argv.gitlabpath}/-/jobs/${argv.jobid}/artifacts/raw/mythras.zip`

fs.writeFileSync('system.json', JSON.stringify(system, null, 2))

console.log(system.manifest)

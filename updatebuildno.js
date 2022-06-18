import { option } from 'yargs'
import { readFileSync, writeFileSync } from 'fs'

const argv = option('versiontag', {
  type: 'string',
  description: 'specifies the version tag (CI_COMMIT_TAG)'
})
  .option('gitlabpath', {
    type: 'string',
    description:
      'The path on gitlab where this branch is stored (CI_PROJECT_PATH)'
  })
  .demandOption(['branch', 'buildno']).argv

const systemRaw = readFileSync('system.json')
let system = JSON.parse(systemRaw)

system.version = `${argv.versiontag}`
system.url = `https://gitlab.com/${argv.gitlabpath}`
system.manifest = `https://gitlab.com/${argv.gitlabpath}/-/jobs/artifacts/${argv.versiontag}/raw/system.json?job=build`
system.download = `https://gitlab.com/${argv.gitlabpath}/-/jobs/artifacts/${argv.versiontag}/raw/pf2e.zip?job=build`

writeFileSync('system.json', JSON.stringify(system, null, 2))

console.log(system.manifest)

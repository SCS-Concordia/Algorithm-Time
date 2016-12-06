fs = require "fs"

ids = []
unMatched = []
match = null
licenses = {}

for descriptor in  fs.readFileSync("src/licenses.txt").toString().split("\n")
  if match = descriptor.match /See "(.*)"$/
    # ignore any cross-references
  else if match = descriptor.match /^([^\(]+) \(([\w-\.]+)\)( \([\w\' ]+\))?$/
    licenses[match[2]] = match[1]
    ids.push match[2]
  else
    unMatched.push descriptor
if unMatched.length > 0
  console.error unMatched
  throw new Error "There were unmatched lines."

fs.writeFileSync "lib/licenses.json", JSON.stringify licenses, null, 2
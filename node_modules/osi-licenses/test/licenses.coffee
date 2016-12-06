assert = require "assert"
licenses = require "../"

describe "licenses", ->
  it "includes 69 licenses", ->
    numLicenses = Object.keys(licenses).length
    assert.equal numLicenses, 69
  it "has proper content", ->
    assert.equal licenses["MIT"], "MIT license"

  
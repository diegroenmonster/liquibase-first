var fs = require('fs'),
  path = require('path')

_ = require('underscore')

_.deepObjectExtend = function (target, source) {
  for (var prop in source)
    if (prop in target && _.isArray(source[prop]) == false && _.isArray(target[prop]) == false)
      _.deepObjectExtend(target[prop], source[prop])
    else
      target[prop] = source[prop]
  return target
}

var handlebars = require('handlebars')

module.exports = function init (dbName, schemaName, serviceUser, author) {
  var model = {
    db_name: dbName,
    schema_name: schemaName,
    role_name: serviceUser,
    author: author
  }

  walk(path.join(__dirname, '/boilerplate'), '.', model)
}

function walk (dir, relativePath, model) {
  if (!fs.existsSync(dir)) {
    return []
  }

  var items = fs.readdirSync(dir).filter(function (f) {
    return f && f[0] != '.' // Ignore hidden files
  })
  for (var key in items) {
    var f = items[key]
    var p = path.join(dir, f),
      stat = fs.statSync(p)

    var relFile = f.replace(/schema_name/g, model.schema_name).replace(/db_name/g, model.db_name)

    var relPath = path.join(relativePath + '/', relFile)
    console.log(p)
    console.log(relPath)
    if (stat.isDirectory()) {
      if (!fs.existsSync(relPath)) {
        fs.mkdirSync(relPath)
        console.log('created:' + relPath)
      }
      walk(p, relPath, model)
    } else {
      var modelTemplate = fs.readFileSync(p, 'utf8')
      var compiledTemplate = handlebars.compile(modelTemplate)

      writeTemplate(model, compiledTemplate, relPath)
    }
  }
}

function writeTemplate (model, compiledTemplate, fileName) {
  var output = compiledTemplate(model)
  fs.writeFile(fileName, output, function (err) {
    if (err) {
      return console.log(err)
    }
  })
}

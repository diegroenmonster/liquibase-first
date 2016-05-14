var fs = require('fs'),
  path = require('path')

YAML = require('yamljs')
JSONFILE = require('jsonfile')

_ = require('underscore')
var walk = require('../utils/walk')

var handlebars = require('handlebars')

module.exports = function roles (dir, config) {
  var files = []
  walk(dir, /roles-[0-9\.]+\.yml$/ig, files)
  var templatePath = path.join(__dirname, '../templates/roles.init.tmpl')
  var modelTemplate = fs.readFileSync(templatePath, 'utf8')
  var compiledTemplate = handlebars.compile(modelTemplate)

  for (var key in files) {
    createfile(files[key], config, compiledTemplate)
  }
}

function wrapContent (content) {
  return content.replace(/'/g, '/*quot*/')
}

function createfile (file, config, compiledTemplate) {
  var nativeObject = YAML.load(file.path)
  var rights = _(_(nativeObject['rights']).map(m => m.right)).indexBy(p => p.label)
  var functions = _(_(nativeObject['functions']).map(m => m['function'])).indexBy(p => p.label)
  var roles = _(_(nativeObject['roles']).map(m => m.role)).indexBy(p => p.label)
  var roleList = []
  var appId = nativeObject['app-id']

  var functionRights = {}
  for (var rKey in roles) {
    var role = roles[rKey]
    for (var fKey in role.functions) {
      var f = role.functions[fKey]['function']
      var fr = functionRights[f['label']]
      if (!fr) {
        fr = []
        functionRights[f['label']] = fr
      }

      var allRights = f.rights.split('|')
      for (var r in allRights) {
        var right = allRights[r]
        if (_(fr).filter(m => m == right).length == 0) {
          fr.push(right)
        }
        roleList.push({appId: appId, role: role.label, role_desc: wrapContent(role.desc), function: f['label'], right: right })
      }
    }
  }


  var frlist = []
  for (var key in functionRights) {
    var fr = functionRights[key]
    for (var i in fr) {
      var right = fr[i]
      frlist.push({appId: appId, function: key, function_desc: wrapContent(functions[key].desc), right: right, right_desc: wrapContent(rights[right].desc) })
    }
  }

  var model = {
    roles: roleList,
    functionRights: frlist,
    appId: appId,
    roles_serialised: JSON.stringify(roleList),
    fr_serialised: JSON.stringify(frlist),
    author: 'system'
  }

  writeTemplate(model, compiledTemplate, file.path.replace('.yml', '.xml'))
}

function writeTemplate (model, compiledTemplate, fileName) {
  var output = compiledTemplate(model)
  output = output.replace(/( {4,4})/gm, '\t')
  output = output.replace(/&lt;/g, '<')
  output = output.replace(/&gt;/g, '>')
  output = output.replace(/&quot;/g, '"')
  output = output.replace(/\/\*quot\*\//g, "''")
  console.log('output: ' + fileName)
  fs.writeFile(fileName, output, function (err) {
    if (err) {
      return console.log(err)
    }
  })
}

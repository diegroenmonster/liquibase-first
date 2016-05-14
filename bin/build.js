var fs = require('fs'),
  path = require('path')

YAML = require('yamljs')
JSONFILE = require('jsonfile')
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
handlebars.registerHelper('foreach', function (arr, options) {
  if (options.inverse && !arr.length)
    return options.inverse(this)

  return arr.map(function (item, index) {
    item.$index = index
    item.$first = index === 0
    item.$last = index === arr.length - 1
    return options.fn(item)
  }).join('')
})

handlebars.registerHelper('ifeq', function (v1, v2, options) {
  if (v1 === v2) {
    return options.fn(this)
  }
  return options.inverse(this)
})

var typeConvertCSharp = require('./typeConvertCSharp')

var plugins = {}
plugins.model = require('./plugins/model')
plugins.sqlfile = require('./plugins/sqlfile')

var preBuilds = {}
preBuilds.roles = require('./prebuilds/roles')

module.exports = function build (dir, suffix, language, template) {
  var fruitConfigFile = path.join(__dirname, 'fruit.json')
  console.log('Loading global config')
  var globalFruit = JSONFILE.readFileSync(fruitConfigFile)

  var config = globalFruit
  var localPath = path.join(dir, 'fruit.json')
  console.log('Config path:' + localPath)
  JSONFILE.readFile(localPath, function (error, localFruit) {
    if (!error) {
      console.log('Loading local config')
      config = _.deepObjectExtend(globalFruit, localFruit)
    } else {
      console.log('local config > ' + error)
    }
    console.log('Reading directory structer')
    console.log(JSON.stringify(config))
    for (var preKey in preBuilds) {
      var preBuild = preBuilds[preKey]
      preBuild(dir, config)
    }

    create(dir, suffix, language, template, config)
  })
}

function create (dir, suffix, language, template, config) {
  var list = []
  walk(dir, suffix, list)

  console.log('Items found: ' + list.length)
  var tables = {}

  function camelCase (val) {
    var list = val.split('_')
    var nlist = []
    for (var key in list) {
      var v = ('' + list[key][0]).toUpperCase() + list[key].substr(1)
      nlist.push(v)
    }

    return nlist.join('_')
  }

  function removeUnderscores (val) {
    return val.replace('_', '')
  }

  var methodMap = {
    camel: camelCase,
    noscore: removeUnderscores
  }

  function formatWithMap (value, methods) {
    var methods = methods.split('|')
    var rVal = value
    for (var runKey in methods) {
      rVal = methodMap[methods[runKey]](rVal)
    }

    return rVal
  }

  function getType (type) {
    if (!type)
      return

    var i = type.indexOf('(')
    if (i >= 0) {
      return type.substr(0, i).trim().toLowerCase()
    }
    return type.trim().toLowerCase()
  }

  function getSize (type) {
    if (!type)
      return
    var i = type.indexOf('(')
    if (i >= 0) {
      var iend = type.indexOf(')')

      return type.substr(i + 1, iend - 1).trim()
    }
    return undefined
  }

  function getPrecision (type) {
    if (!type)
      return
    var i = type.indexOf('(')
    if (i >= 0) {
      var iend = type.indexOf(')')

      return type.substr(i + 1, iend - 1).trim()
    }
    return undefined
  }

  function getNamespace (path, namespace) {
    var l = path.lastIndexOf('\\')
    console.log('>>' + l)
    return (namespace ? (namespace + '.') : '') + path.substr(0, l).replace('\\', '.')
  }

  function mapColumnProperties (m) {
    return {
      name: m.column['name'],
      type: getType(m.column['type']),
      size: getSize(m.column['type']),
      precision: getPrecision(m.column['type']),
      serialize: m.column['serialize'],
      auto: m.column.autoIncrement === true,
      pk: m.column.constraints ? m.column.constraints.primaryKey === true : false,
      nullable: m.column.constraints ? m.column.constraints.nullable === true : true
    }
  }

  for (var key in list) {
    var f = list[key]
    nativeObject = YAML.load(f.path)
    var changeLog = nativeObject['databaseChangeLog']
    if (changeLog) {
      for (var cKey in changeLog) {
        var changeSet = changeLog[cKey]['changeSet']
        for (var changeKey in changeSet.changes) {
          var change = changeSet.changes[changeKey]
          if (change.createTable) {
            var createTable = change['createTable']
            var table = {
              schema: createTable.schemaName,
              name: createTable.tableName,
              properties: {},
              nameSpace: getNamespace(f.path),
              path: f.path.replace(suffix, ''),
            }

            table.properties = createTable.columns.map(mapColumnProperties)

            tables[createTable.tableName] = table
          }
          if (change.addColumn) {
            var addColumn = change['addColumn']
            var table = tables[addColumn.tableName]

            var properties = addColumn.columns.map(mapColumnProperties);
            properties.forEach(function(prop) {
              this.properties.push(prop);
            }, table);
          }
          if (change.dropColumn) {
            var dropColumn = change['dropColumn'];
            
            for(var colKey in table.changes){
              var colChange = table.changes[colKey];
              var table = tables[colChange.tableName]
              table.properties = table.properties.filter(m => m.name != colChange.columnName);
            }
            
          }
          if (change.addNotNullConstraint) {
            var addNotNullConstraint = change['addNotNullConstraint']
            var table = tables[addNotNullConstraint.tableName]
            var column = _(table.properties.filter(m => m.name == addNotNullConstraint.columnName)).first();
            
            if (column){
              column.nullable = false;
            }
          }
          if (change.dropNotNullConstraint) {
            var dropNotNullConstraint = change['dropNotNullConstraint']
            var table = tables[dropNotNullConstraint.tableName]
            var column = _(table.properties.filter(m => m.name == dropNotNullConstraint.columnName)).first();
            
            if (column){
              column.nullable = true;
            }
          }
        }
      }
    }
  }

  var csNamespace = (config.csharp.options ? config.csharp.options.namespace : undefined) || config.options.namespace || ''
  var classFormatMethods = config.csharp.options.format.class
  var propertyFormatMethods = config.csharp.options.format.property
  var namespaceFormatMethods = config.csharp.options.format.namespace
  var arrayFormatString = config.csharp.options.array_replace

  console.log(csNamespace)

  for (var tKey in tables) {
    var table = tables[tKey]

    table.fmt = {
      name: formatWithMap(table.name, classFormatMethods),
      nameSpace: formatWithMap((csNamespace ? (csNamespace + '.') : '') + table.nameSpace, namespaceFormatMethods)
    }
  }

  for (var tKey in tables) {
    var table = tables[tKey]

    table.properties.map(function (m) {
      m.fmt = {
        type: typeConvertCSharp(m.type, m.size, m.precision, m.nullable, m.serialize, tables, arrayFormatString),
        name: formatWithMap(m.name, propertyFormatMethods)
      }
      return m
    })
  }
  for (var langKey in config) {
    if (langKey == 'options' || langKey == 'prebuilds' || langKey == 'postbuilds')
      continue

    var language = config[langKey]
    var rootNamespaces = language.options && language.options.include ? language.options.include : []
    for (var tkey in language) {
      if (tkey == 'options')
        continue

      var template = language[tkey]
      console.log('Running: ' + langKey + '>' + tkey)
      var templateNamespaces = []
      for (var rnKey in rootNamespaces) {
        templateNamespaces.push(rootNamespaces[rnKey])
      }
      var tempIncludes = template.include ? template.include : []
      for (var rnKey in tempIncludes) {
        templateNamespaces.push(tempIncludes[rnKey])
      }

      var pluginTemplates = []

      var pluginConfig = plugins[tkey](config)
      for (var iKey in pluginConfig) {
        var pconf = pluginConfig[iKey]
        pluginTemplates.push(
          {
            compiledTemplate: handlebars.compile(pconf.template),
            ext: pconf.ext
          }
        )
      }

      for (var tableKey in tables) {
        var table = tables[tableKey]
        table.fmt.include = templateNamespaces
        for (var templateKey in pluginTemplates) {
          var plugintemplate = pluginTemplates[templateKey]
          var folder = (table.path + plugintemplate.ext).replace(/(.*)\/(.*)$/, '$1')
          console.log('combined:' + folder)
          if (folder && folder != plugintemplate.ext && !folder.match(/\./)) {
            if (!fs.existsSync(folder)) {
              fs.mkdirSync(folder)
              console.log('created:' + folder)
            }
          }
          writeTemplate(table, plugintemplate.compiledTemplate, table.path + plugintemplate.ext)
        }
      }
    }
  }

  return list
}

function writeTemplate (table, compiledTemplate, fileName) {
  var output = compiledTemplate(table)
  output = output.replace(/( {4,4})/gm, '\t')
  output = output.replace(/&lt;/g, '<')
  output = output.replace(/&gt;/g, '>')
  console.log('output: ' + fileName)
  fs.writeFile(fileName, output, function (err) {
    if (err) {
      return console.log(err)
    }
  })
}

function walk (dir, suffix, list) {
  if (!fs.existsSync(dir)) {
    return []
  }

  var items = fs.readdirSync(dir).filter(function (f) {
    return f && f[0] != '.' // Ignore hidden files
  })

  // Checks if we haven't reached a sub project
  if (dir != '.') {
    var fruitJs = items.filter(p => {
      return p.toLowerCase() == 'fruit.js'
    }).length > 0
    if (fruitJs) {
      return []
    }
  }
  for (var key in items) {
    var f = items[key]
    var p = path.join(dir, f),
      stat = fs.statSync(p)

    if (stat.isDirectory()) {
      walk(p, suffix, list)
    } else {
      if (f.substr(-suffix.length) === suffix) {
        list.push({
          name: f,
          type: 'file',
          path: p,
          size: stat.size
        })
      }
    }
  }
}

var fs = require('fs'),
  path = require('path')

module.exports = function buildsqlfile (config) {
  var repoPath = path.join(__dirname, '../templates/sqlfile/repository.cs')
  var repoExt = '/Repository.cs'
  var repoTemplate = fs.readFileSync(repoPath, 'utf8')

  var createPath = path.join(__dirname, '../templates/sqlfile/create.db.sql')
  var createExt = '/Create.db.sql'
  var createTemplate = fs.readFileSync(createPath, 'utf8')

  var readPath = path.join(__dirname, '../templates/sqlfile/read.db.sql')
  var readExt = '/Read.db.sql'
  var readTemplate = fs.readFileSync(readPath, 'utf8')

  var updatePath = path.join(__dirname, '../templates/sqlfile/update.db.sql')
  var updateExt = '/Update.db.sql'
  var updateTemplate = fs.readFileSync(updatePath, 'utf8')

  var deletePath = path.join(__dirname, '../templates/sqlfile/delete.db.sql')
  var deleteExt = '/Delete.db.sql'
  var deleteTemplate = fs.readFileSync(deletePath, 'utf8')

  return [
    {
      template: createTemplate,
      ext: createExt,
      platforms: ['csharp']
    },
    {
      template: readTemplate,
      ext: readExt,
      platforms: ['csharp']
    },
    {
      template: updateTemplate,
      ext: updateExt,
      platforms: ['csharp']
    },
    {
      template: deleteTemplate,
      ext: deleteExt,
      platforms: ['csharp']
    },
    {
      template: repoTemplate,
      ext: repoExt,
      platforms: ['csharp']
    }
  ]
}

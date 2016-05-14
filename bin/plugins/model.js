var fs = require('fs'),
  path = require('path')

module.exports = function buildmodel (config) {
  var templatePath = path.join(__dirname, '../templates/model/model.cs')
  var templateExt = '.cs'
  var template = fs.readFileSync(templatePath, 'utf8')


  return [
    {
      template: template,
      ext: templateExt,
      platforms: ['csharp']
    }
  ]
}

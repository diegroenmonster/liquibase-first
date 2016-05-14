module.exports = function typeConvertCSharp (type, length, precision, nullable, serialize, tables, array_replace) {
  var serializeJsontTo = serialize
  if (serializeJsontTo) {
    var changeToTable = tables[serializeJsontTo]
    if (changeToTable) {
      serializeJsontTo = changeToTable.fmt.name
    }
  } else {
    serializeJsontTo = 'string'
  }
  var arrayType = type.match(/(.*)(\[.*\])/ig)
  if (arrayType) {
    type = type.replace(/(.*)(\[.*\])/ig, '$1').trim()
  }
  var newType = 'object'
  switch (type) {
    case 'integer':
    case 'int':
    case 'serial':
      newType = 'int' + (nullable ? '?' : '')
      break
    case 'text':
    case 'varchar':
    case 'nvarchar':
    case 'char':
      newType = length && length <= 1 ? 'char' : 'string'
      break
    case 'numeric':
      newType = 'decimal' + (nullable ? '?' : '')
      break
    case 'double':
      newType = 'double' + (nullable ? '?' : '')
      break
    case 'boolean':
    case 'bool':
      newType = 'bool' + (nullable ? '?' : '')
      break
    case 'bigint':
    case 'bigserial':
      newType = 'long' + (nullable ? '?' : '')
      break
    case 'date':
    case 'timestamp without time zone':
    case 'timestamp with time zone':
    case 'timestamp':
      newType = 'DateTime' + (nullable ? '?' : '')
      break
    case 'json':
    case 'jsonb':
      newType = serializeJsontTo
      break
    default:
      newType = 'object'
  }

  if (arrayType) {
    newType = (newType + '[]').replace(/(.*)(\[.*\])/ig, array_replace)
  }
  return newType
}
